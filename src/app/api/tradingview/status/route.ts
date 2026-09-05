import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TVSessionManager } from "@/lib/tradingview/session-manager";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ status: "disconnected" }, { status: 401 });
    }

    const status = await TVSessionManager.getStatus(session.userId);
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ status: "disconnected" }, { status: 500 });
  }
}
