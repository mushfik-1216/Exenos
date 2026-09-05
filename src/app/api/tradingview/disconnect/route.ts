import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TVSessionManager } from "@/lib/tradingview/session-manager";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await TVSessionManager.removeCredentials(session.userId);
    return NextResponse.json({ success: true, status: "disconnected" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error disconnecting TradingView";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
