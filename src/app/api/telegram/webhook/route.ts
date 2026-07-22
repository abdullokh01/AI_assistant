// Telegram Webhook API Handler - AI Project Intelligence Platform
// Path: src/app/api/telegram/webhook/route.ts

import { NextResponse } from 'next/server';
import { TelegramBotService } from '../../../../lib/core/infrastructure/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received Telegram Update:', JSON.stringify(body));

    const botService = new TelegramBotService();
    await botService.handleWebhookUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support GET for webhook health checks
export async function GET() {
  return NextResponse.json({ status: 'active', botTokenConfigured: !!process.env.TELEGRAM_BOT_TOKEN });
}
