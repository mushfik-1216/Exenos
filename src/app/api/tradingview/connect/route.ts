import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TVSessionManager } from "@/lib/tradingview/session-manager";
import { validateTradingViewCredentials } from "@/lib/tradingview/validator";
import { TVCredentials } from "@/types/tradingview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = (await request.json()) as TVCredentials;
    if (!body.credentialValue || !body.connectionType) {
      return NextResponse.json(
        { success: false, error: "Connection type and credential value required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const validation = await validateTradingViewCredentials(body.connectionType, body.credentialValue);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || "TradingView validation failed" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await TVSessionManager.saveCredentials(
      session.userId,
      body.connectionType,
      body.credentialValue,
      body.rememberSession,
      body.removeOnExit
    );

    return NextResponse.json(
      {
        success: true,
        status: "connected",
        connectionType: body.connectionType,
        username: validation.username,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error connecting to TradingView";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
