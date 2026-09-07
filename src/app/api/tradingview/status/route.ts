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

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ status: "disconnected" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const status = await TVSessionManager.getStatus(session.userId);
    return NextResponse.json(status, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ status: "disconnected" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
