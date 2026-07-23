// Email (IMAP/SMTP) Integration Service - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/email.ts

import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { ImapFlow } from 'imapflow';
import { EmailRepository } from './supabase';
import { ClaudeService } from './claude';
import { Email } from '../domain/types';

// Simple IMAP sync simulator (since IMAP connection logic is stateful and blocking,
// and environment variables might be empty during local dev)
export class EmailService {
  private emailRepo = new EmailRepository();
  private claudeService = new ClaudeService();

  // Connects to IMAP, pulls emails, classifies them and generates drafts
  async syncEmails(
    projectId: string,
    imapConfig: { host?: string; port?: number; user?: string; password?: string }
  ): Promise<Email[]> {
    const isMock = !imapConfig.host || !imapConfig.user || !imapConfig.password;

    if (isMock) {
      console.log(`Syncing emails in MOCK mode for project: ${projectId}`);
      // Generate some mock emails if none exist in the database
      const existing = await this.emailRepo.listByProject(projectId);
      if (existing.length === 0) {
        const mockEmailsData = [
          {
            projectId,
            messageId: `<mock-msg-1@client.com>`,
            threadId: 'thread-1',
            fromEmail: 'client-director@company.com',
            fromName: 'Sarah Jenkins (Client)',
            toEmail: ['project-lead@firm.com'],
            subject: 'URGENT: Change in UI specification requirements',
            body: 'Hi, we decided to change the sidebar layout of the main dashboard. We need a glassmorphism theme instead of solid blue. Can you please implement this by Friday?',
            receivedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          },
          {
            projectId,
            messageId: `<mock-msg-2@dev.com>`,
            threadId: 'thread-2',
            fromEmail: 'developer-lee@firm.com',
            fromName: 'Lee (Backend Dev)',
            toEmail: ['project-lead@firm.com'],
            subject: 'Database Schema migrations completed',
            body: 'Hey team, I have completed the migration files and they are ready for testing. Trello card has been moved to Done.',
            receivedAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
          },
        ];

        const syncedEmails: Email[] = [];
        for (const data of mockEmailsData) {
          // Classify and draft
          const { classification, draftReply } = await this.claudeService.classifyAndDraftEmail(
            data.subject,
            data.body,
            data.fromEmail,
            `Project ID: ${projectId}. A software development project for a dashboard.`
          );

          const saved = await this.emailRepo.save({
            ...data,
            classification,
            responseDraft: draftReply,
          });
          syncedEmails.push(saved);
        }
        return syncedEmails;
      }
      return existing;
    }

    // REAL IMAP SYNC IMPLEMENTATION using ImapFlow
    console.log(`Connecting to IMAP host: ${imapConfig.host}:${imapConfig.port}`);

    const client = new ImapFlow({
      host: imapConfig.host!,
      port: imapConfig.port || 993,
      secure: (imapConfig.port || 993) === 993,
      auth: {
        user: imapConfig.user!,
        pass: imapConfig.password!,
      },
      logger: false,
    });

    const syncedEmails: Email[] = [];

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Build a set of already-stored message ids to avoid duplicates
        const existing = await this.emailRepo.listByProject(projectId);
        const knownIds = new Set(existing.map((e) => e.messageId));

        // Fetch the most recent messages (cap to last 20 to stay within limits)
        const mailbox: any = client.mailbox;
        const total = mailbox && mailbox.exists ? mailbox.exists : 0;
        if (total === 0) {
          return existing;
        }
        const start = Math.max(1, total - 19);
        const range = `${start}:*`;

        for await (const msg of client.fetch(range, { source: true })) {
          const parsed = await simpleParser(msg.source as Buffer);

          const messageId = parsed.messageId || `<imap-${projectId}-${msg.uid}>`;
          if (knownIds.has(messageId)) continue;

          const subject = parsed.subject || '(no subject)';
          const body = parsed.text || parsed.html || '';
          const fromEmail = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
          const fromName = parsed.from?.value?.[0]?.name || fromEmail;
          const toEmail = (parsed.to && 'value' in parsed.to)
            ? parsed.to.value.map((a) => a.address || '').filter(Boolean)
            : [];
          const receivedAt = parsed.date || new Date();

          // Classify and draft a reply with Claude
          const { classification, draftReply } = await this.claudeService.classifyAndDraftEmail(
            subject,
            body,
            fromEmail,
            `Project ID: ${projectId}. A software development project.`
          );

          const saved = await this.emailRepo.save({
            projectId,
            messageId,
            threadId: parsed.inReplyTo || undefined,
            fromEmail,
            fromName,
            toEmail,
            subject,
            body,
            receivedAt,
            classification,
            responseDraft: draftReply,
          });
          syncedEmails.push(saved);
          knownIds.add(messageId);
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => {});
    }

    // Return the full up-to-date list for the project
    return await this.emailRepo.listByProject(projectId);
  }

  // Send an SMTP reply for a draft email
  async sendEmailReply(
    emailId: string,
    smtpConfig: { host?: string; port?: number; user?: string; pass?: string }
  ): Promise<boolean> {
    const email = await this.emailRepo.getById(emailId);
    if (!email || !email.responseDraft) {
      throw new Error('Email not found or has no response draft');
    }

    const isMock = !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass;

    if (isMock) {
      console.log(`Sending email reply in MOCK mode for email: ${emailId}`);
      // Mark as sent
      await this.emailRepo.save({
        ...email,
        sentAt: new Date(),
      });
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpConfig.user,
        to: email.fromEmail,
        subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        text: email.responseDraft,
      });

      console.log('Email sent successfully:', info.messageId);

      // Update email in DB
      await this.emailRepo.save({
        ...email,
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('SMTP sending failed:', error);
      throw error;
    }
  }
}
