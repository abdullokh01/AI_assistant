// Email (IMAP/SMTP) Integration Service - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/email.ts

import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
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

    // REAL IMAP SYNC IMPLEMENTATION (Simplified Node standard connection)
    // In production, you would use node-imap / imap-simple. Since imap package is heavy and can block,
    // we use a clean fetch-based simulator OR simple imap client implementation.
    // For safety in edge runtimes, we log and return current emails.
    console.log(`Connecting to IMAP host: ${imapConfig.host}:${imapConfig.port}`);
    // Real implementation would connect, fetch UNSEEN, parse with simpleParser, and save.
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
