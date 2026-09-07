import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TelegramClient } from "@/lib/telegram/telegram-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const client = new TelegramClient();
    if (!client.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram Bot is not configured in .env.local (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const testMessage = `🤖 <b>EXENOS Alert System</b>\n\n✅ <i>Telegram connectivity successfully verified!</i>\nTime: <code>${new Date().toISOString()}</code>`;
    const result = await client.sendMessage(testMessage);

    if (result.success) {
      return NextResponse.json(
        { success: true, message: "Test alert dispatched successfully to Telegram channel." },
        { headers: NO_CACHE_HEADERS }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send alert via Telegram." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Telegram test error";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
