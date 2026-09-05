import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TelegramClient } from "@/lib/telegram/telegram-client";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = new TelegramClient();
    if (!client.isConfigured()) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in environment" },
        { status: 400 }
      );
    }

    const testMessage = `<b>🔔 EXENOS TELEGRAM TEST</b>\n\nConnection verified successfully from private terminal.\n<b>Timestamp:</b> ${new Date().toISOString()}`;
    const result = await client.sendMessage(testMessage);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Test alert dispatched to Telegram" });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Telegram test error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
