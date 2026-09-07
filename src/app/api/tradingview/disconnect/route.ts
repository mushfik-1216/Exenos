import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TVSessionManager } from "@/lib/tradingview/session-manager";

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

    await TVSessionManager.removeCredentials(session.userId);
    return NextResponse.json({ success: true, status: "disconnected" }, { headers: NO_CACHE_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error disconnecting from TradingView";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
