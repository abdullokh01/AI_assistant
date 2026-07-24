// Telegram Bot Integration Service - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/telegram.ts

import { TelegramRepository, ProjectRepository, ActivityRepository, SettingsRepository, MemoryRepository } from './supabase';
import { TelegramChat } from '../domain/types';
import { supabaseAdmin } from '../../shared/supabase-client';
import { TrelloService } from './trello';
import { EmailService } from './email';

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const isMock = !botToken;

// Placeholder project that owns global settings and per-user bot sessions.
const SYSTEM_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export class TelegramBotService {
  private telegramRepo = new TelegramRepository();
  private projectRepo = new ProjectRepository();
  private activityRepo = new ActivityRepository();
  private settingsRepo = new SettingsRepository();
  private memoryRepo = new MemoryRepository();

  private getApiUrl(method: string) {
    return `https://api.telegram.org/bot${botToken}/${method}`;
  }

  // Sends a message to Telegram
  async sendMessage(chatId: number, text: string, replyMarkup?: any): Promise<boolean> {
    if (isMock) {
      console.log(`[TELEGRAM BOT MOCK] Sent to ${chatId}: ${text}`);
      return true;
    }

    try {
      const res = await fetch(this.getApiUrl('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to send Telegram message:', e);
      return false;
    }
  }

  // Answer callback query
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
    if (isMock) return true;
    try {
      const res = await fetch(this.getApiUrl('answerCallbackQuery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Edit message text
  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any): Promise<boolean> {
    if (isMock) {
      console.log(`[TELEGRAM BOT MOCK] Edited message ${messageId} in ${chatId}: ${text}`);
      return true;
    }
    try {
      const res = await fetch(this.getApiUrl('editMessageText'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Registers webhook with Telegram
  async setWebhook(url: string): Promise<boolean> {
    if (isMock) return true;
    try {
      const res = await fetch(this.getApiUrl('setWebhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return data.ok;
    } catch (e) {
      return false;
    }
  }

  // Processes webhook payloads from Telegram
  async handleWebhookUpdate(update: any): Promise<void> {
    if (!update) return;

    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async ensureSystemProject() {
    const systemProjId = SYSTEM_PROJECT_ID;
    try {
      // 1. Ensure system user exists
      await supabaseAdmin.from('users').upsert({
        id: systemProjId,
        email: 'system-agent@internal.os',
        full_name: 'Jarvis OS Agent',
      }, { onConflict: 'id' });

      // 2. Ensure system project exists
      await supabaseAdmin.from('projects').upsert({
        id: systemProjId,
        name: 'System Settings',
        description: 'Global settings and Telegram sessions placeholder project',
        status: 'active',
        health_score: 100.00,
        confidence_score: 100.00,
      }, { onConflict: 'id' });
    } catch (e) {
      console.error('Failed to seed system user/project:', e);
    }
  }

  // Handle text messages
  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup';

    // 1. Check if user is in a state machine (e.g. creating project name)
    const sessionKey = `tg_session_${userId}`;
    // Fetch user session state from settings or a mock registry
    // In production, we'll store session states under project settings or user metadata.
    // For simplicity, let's check a standard session state using settings table with projectId='00000000-0000-0000-0000-000000000000'
    const systemProjId = SYSTEM_PROJECT_ID; // Represents system settings
    await this.ensureSystemProject();
    const sessionSetting = await this.settingsRepo.get(systemProjId, sessionKey);
    const sessionState = sessionSetting?.value || null;

    if (sessionState && sessionState.action === 'awaiting_project_name') {
      // If user typed a command starting with /, cancel the creation flow
      if (text.startsWith('/')) {
        await this.settingsRepo.save(systemProjId, sessionKey, {});
        // Proceed to command processing
      } else {
        // Create project
        try {
          const ownerId = sessionState.ownerId; // Auth user id mapping
          const newProj = await this.projectRepo.create(
            {
              name: text.trim(),
              description: 'Created via Telegram Bot',
              status: 'active',
              healthScore: 100.00,
              confidenceScore: 100.00,
            },
            ownerId
          );

          // Clear session
          await this.settingsRepo.save(systemProjId, sessionKey, {});

          await this.sendMessage(
            chatId,
            `✅ *Project Created Successfully!*\n\n*Name:* ${newProj.name}\n*ID:* \`${newProj.id}\`\n\nUse the panel to connect this chat to the project.`
          );
        } catch (e: any) {
          await this.sendMessage(chatId, `❌ Failed to create project: ${e.message}`);
        }
        return;
      }
    }

    // 2. Handle Commands
    if (text.startsWith('/start')) {
      await this.sendWelcomeMessage(chatId, isGroup);
    } else if (text.startsWith('/settings')) {
      await this.sendSettingsMenu(chatId);
    } else if (text.startsWith('/sync')) {
      // Sync chat trigger
      await this.handleChatSyncCommand(chatId, text);
    } else if (isGroup) {
      // Group chat activity tracking
      // Log messages to activity log to allow intelligence audits
      const chatConfig = await this.telegramRepo.getByChatId(chatId);
      if (chatConfig && chatConfig.isConnected) {
        await this.activityRepo.log(
          chatConfig.projectId,
          'Telegram Message Tracked',
          `[Telegram] ${message.from.first_name || 'User'}: ${text}`,
          { sender: message.from.first_name, text, username: message.from.username }
        );
      }
    }
  }

  // Handle button clicks (Callback Queries)
  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const id = callbackQuery.id;
    const data = callbackQuery.data || '';
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const messageId = message.message_id;
    const userId = callbackQuery.from.id;

    await this.answerCallbackQuery(id);

    if (data === 'menu_main') {
      await this.editMessageText(chatId, messageId, '*AI Project OS Bot*\nManage integrations, projects, and notifications.', this.getMainMenuMarkup());
    } else if (data === 'menu_projects') {
      await this.showProjectsMenu(chatId, messageId, userId);
    } else if (data === 'project_new') {
      // Ask user to type name
      const systemProjId = SYSTEM_PROJECT_ID;
      await this.ensureSystemProject();
      await this.settingsRepo.save(systemProjId, `tg_session_${userId}`, {
        action: 'awaiting_project_name',
        ownerId: '00000000-0000-0000-0000-000000000000', // Assign to system user mock
      });
      await this.sendMessage(chatId, '📝 Please enter the *Project Name* in your next message:');
    } else if (data.startsWith('proj_view_')) {
      const projId = data.replace('proj_view_', '');
      await this.showProjectSettings(chatId, messageId, projId);
    } else if (data.startsWith('proj_sync_')) {
      const projId = data.replace('proj_sync_', '');
      // Trigger sync
      await this.editMessageText(
        chatId,
        messageId,
        `⏳ Syncing Project \`${projId}\`... Trello cards and Emails are being updated.`,
        {
          inline_keyboard: [[{ text: '⬅️ Back', callback_data: `proj_view_${projId}` }]],
        }
      );

      // Run the real sync against Trello + Email integrations
      const summary = await this.runProjectSync(projId);
      await this.sendMessage(chatId, summary);
    } else if (data === 'menu_intel') {
      await this.showIntelligence(chatId, messageId);
    } else if (data === 'menu_notifications') {
      await this.showNotificationSettings(chatId, messageId);
    } else if (data === 'notif_toggle') {
      await this.toggleGlobalNotifications(chatId, messageId);
    } else if (data.startsWith('proj_alerts_')) {
      await this.toggleProjectAlerts(chatId, messageId, data.replace('proj_alerts_', ''));
    } else if (data.startsWith('proj_mem_')) {
      await this.showProjectMemory(chatId, messageId, data.replace('proj_mem_', ''));
    } else if (data.startsWith('proj_connect_chat_')) {
      const projId = data.replace('proj_connect_chat_', '');
      // Link current chat to project
      try {
        await this.telegramRepo.save({
          projectId: projId,
          chatId,
          title: message.chat.title || 'Telegram Group',
          isConnected: true,
          settings: {},
          syncStatus: 'idle',
        });
        await this.editMessageText(chatId, messageId, `✅ Linked current chat to Project!`, {
          inline_keyboard: [[{ text: '⬅️ Back', callback_data: `proj_view_${projId}` }]],
        });
      } catch (e: any) {
        await this.sendMessage(chatId, `❌ Failed to connect chat: ${e.message}`);
      }
    }
  }

  // Welcome response
  private async sendWelcomeMessage(chatId: number, isGroup: boolean) {
    const text = `🚀 *Welcome to AI Project OS!*\n\nI am the intelligent agent running project delivery operations. Connect me to your Telegram Group chats, sync Trello, and let me handle project health audits, email classification, and CEO daily executive summaries.`;
    await this.sendMessage(chatId, text, this.getMainMenuMarkup());
  }

  private async sendSettingsMenu(chatId: number) {
    await this.sendMessage(chatId, '⚙️ *Bot Settings Menu*', this.getMainMenuMarkup());
  }

  private getMainMenuMarkup() {
    return {
      inline_keyboard: [
        [{ text: '📂 Projects & Connects', callback_data: 'menu_projects' }],
        [{ text: '🔔 Global Notifications', callback_data: 'menu_notifications' }],
        [{ text: '🤖 Intelligence Dashboard', callback_data: 'menu_intel' }],
      ],
    };
  }

  // Projects list
  private async showProjectsMenu(chatId: number, messageId: number, tgUserId: number) {
    // List all projects. For bot commands, fetch all projects in database
    const systemProjId = SYSTEM_PROJECT_ID;
    // We fetch all standard projects
    const { data: projects, error } = await supabaseAdmin.from('projects').select('id, name');
    
    const inlineKeyboard: any[] = [];
    if (projects && projects.length > 0) {
      projects.forEach((p: any) => {
        inlineKeyboard.push([{ text: `📁 ${p.name}`, callback_data: `proj_view_${p.id}` }]);
      });
    }

    inlineKeyboard.push([{ text: '➕ Create Project', callback_data: 'project_new' }]);
    inlineKeyboard.push([{ text: '⬅️ Back', callback_data: 'menu_main' }]);

    await this.editMessageText(
      chatId,
      messageId,
      `📂 *Active Projects List*\nSelect a project to configure notification alerts, sync settings, or link Telegram chats.`,
      { inline_keyboard: inlineKeyboard }
    );
  }

  // Project Settings menu
  private async showProjectSettings(chatId: number, messageId: number, projectId: string) {
    const proj = await this.projectRepo.getById(projectId);
    if (!proj) {
      await this.sendMessage(chatId, '❌ Project not found.');
      return;
    }

    const inlineKeyboard = [
      [{ text: '🔄 Sync Trello & Emails', callback_data: `proj_sync_${projectId}` }],
      [{ text: '🔗 Connect Telegram Chat', callback_data: `proj_connect_chat_${projectId}` }],
      [
        { text: '🔔 Alerts Toggle', callback_data: `proj_alerts_${projectId}` },
        { text: '🧠 Project Memory', callback_data: `proj_mem_${projectId}` },
      ],
      [{ text: '⬅️ Projects List', callback_data: 'menu_projects' }],
    ];

    const text = `📁 *Project Details: ${proj.name}*\n\n` +
      `*Health Score:* ${proj.healthScore}%\n` +
      `*AI Confidence:* ${proj.confidenceScore}%\n` +
      `*Status:* ${proj.status.toUpperCase()}\n\n` +
      `Select an operation below:`;

    await this.editMessageText(chatId, messageId, text, { inline_keyboard: inlineKeyboard });
  }

  // Handle /sync command
  private async handleChatSyncCommand(chatId: number, text: string) {
    const chat = await this.telegramRepo.getByChatId(chatId);
    if (!chat) {
      await this.sendMessage(
        chatId,
        `❌ Chat is not linked to any project. Connect this chat by opening settings in direct messages and linking it.`
      );
      return;
    }

    await this.sendMessage(chatId, `⏳ Synchronizing Trello cards and emails...`);
    const summary = await this.runProjectSync(chat.projectId);
    await this.sendMessage(chatId, summary);
  }

  // Cross-project snapshot: task split, waiting emails, open risks.
  private async showIntelligence(chatId: number, messageId: number) {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .neq('id', SYSTEM_PROJECT_ID);

    const lines: string[] = ['🤖 *Intelligence Dashboard*', ''];

    for (const p of projects || []) {
      const [{ data: tasks }, { data: emails }, { data: risks }] = await Promise.all([
        supabaseAdmin.from('tasks').select('status').eq('project_id', p.id),
        supabaseAdmin.from('emails').select('id').eq('project_id', p.id).is('sent_at', null),
        supabaseAdmin.from('risks').select('id').eq('project_id', p.id).eq('status', 'active'),
      ]);

      const count = (s: string) => (tasks || []).filter((t: any) => t.status === s).length;
      lines.push(
        `📁 *${p.name}*`,
        `   Todo ${count('Todo')} · Doing ${count('In Progress')} · Done ${count('Done')} · Blocked ${count('Blocked')}`,
        `   📧 ${(emails || []).length} awaiting reply · ⚠️ ${(risks || []).length} open risks`,
        ''
      );
    }

    if (!projects || projects.length === 0) {
      lines.push('_No active projects yet._');
    }

    await this.editMessageText(chatId, messageId, lines.join('\n'), {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu_main' }]],
    });
  }

  private async notificationsEnabled(): Promise<boolean> {
    await this.ensureSystemProject();
    const setting = await this.settingsRepo.get(SYSTEM_PROJECT_ID, 'global_notifications');
    // Default to on so a fresh install still alerts.
    return setting?.value?.enabled !== false;
  }

  private async showNotificationSettings(chatId: number, messageId: number) {
    const enabled = await this.notificationsEnabled();
    await this.editMessageText(
      chatId,
      messageId,
      `🔔 *Global Notifications*\n\nStatus: *${enabled ? 'ON' : 'OFF'}*\n\nControls whether the bot pushes daily reports and inconsistency alerts.`,
      {
        inline_keyboard: [
          [{ text: enabled ? '🔕 Turn OFF' : '🔔 Turn ON', callback_data: 'notif_toggle' }],
          [{ text: '⬅️ Back', callback_data: 'menu_main' }],
        ],
      }
    );
  }

  private async toggleGlobalNotifications(chatId: number, messageId: number) {
    const enabled = await this.notificationsEnabled();
    await this.settingsRepo.save(SYSTEM_PROJECT_ID, 'global_notifications', { enabled: !enabled });
    await this.showNotificationSettings(chatId, messageId);
  }

  private async toggleProjectAlerts(chatId: number, messageId: number, projectId: string) {
    const key = 'alerts_enabled';
    const current = await this.settingsRepo.get(projectId, key);
    const enabled = current?.value?.enabled !== false;
    await this.settingsRepo.save(projectId, key, { enabled: !enabled });

    await this.editMessageText(
      chatId,
      messageId,
      `🔔 Alerts for this project are now *${!enabled ? 'ON' : 'OFF'}*.`,
      { inline_keyboard: [[{ text: '⬅️ Back', callback_data: `proj_view_${projectId}` }]] }
    );
  }

  private async showProjectMemory(chatId: number, messageId: number, projectId: string) {
    const memories = await this.memoryRepo.listByProject(projectId);

    const lines: string[] = ['🧠 *Project Memory*', ''];
    if (memories.length === 0) {
      lines.push('_Nothing recorded yet._', '', 'Memory fills up as the AI audits emails, Trello and chat.');
    } else {
      for (const m of memories.slice(0, 10)) {
        const text = m.content.length > 140 ? `${m.content.slice(0, 140)}…` : m.content;
        lines.push(`*${m.category}*`, `${text}`, '');
      }
      if (memories.length > 10) lines.push(`_…and ${memories.length - 10} more._`);
    }

    await this.editMessageText(chatId, messageId, lines.join('\n'), {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: `proj_view_${projectId}` }]],
    });
  }

  // Runs a real sync of Trello + Email integrations for a project and
  // returns a human-readable Telegram summary message.
  private async runProjectSync(projectId: string): Promise<string> {
    const lines: string[] = [`✅ *Sync complete for project* \`${projectId}\``, ''];

    // 1. Trello
    try {
      const trelloService = new TrelloService();
      const tasks = await trelloService.syncBoard(
        projectId,
        process.env.TRELLO_API_KEY || '',
        process.env.TRELLO_TOKEN || '',
        process.env.TRELLO_BOARD_ID || ''
      );
      lines.push(`📋 Trello: ${tasks.length} cards synced`);
    } catch (e: any) {
      lines.push(`📋 Trello: ❌ ${e.message}`);
    }

    // 2. Email
    try {
      const emailService = new EmailService();
      const emails = await emailService.syncEmails(projectId, {
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT ? Number(process.env.IMAP_PORT) : undefined,
        user: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD,
      });
      lines.push(`📧 Email: ${emails.length} messages synced`);
    } catch (e: any) {
      lines.push(`📧 Email: ❌ ${e.message}`);
    }

    return lines.join('\n');
  }
}
