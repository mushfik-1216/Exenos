import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { getEnv } from "@/config/env";
import { TwelveDataProvider } from "@/lib/market-data/twelve-data-provider";

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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const env = getEnv();
    const settings = await FileManager.getSettings();
    const twelveProvider = new TwelveDataProvider();
    const isTwelveAvailable = await twelveProvider.isAvailable();

    const hasTwelveKey = Boolean(env.TWELVE_DATA_API_KEY || settings?.twelveDataApiKey);
    const hasAlphaKey = Boolean(env.ALPHA_VANTAGE_API_KEY || settings?.alphaVantageApiKey);

    return NextResponse.json(
      {
        success: true,
        activeProvider: isTwelveAvailable ? "Twelve Data" : "Yahoo Finance",
        hasTwelveKey,
        hasAlphaKey,
        fallbackActive: !isTwelveAvailable,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching market data config";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();
    const twelveDataApiKey = body.twelveDataApiKey ? String(body.twelveDataApiKey).trim() : undefined;
    const alphaVantageApiKey = body.alphaVantageApiKey ? String(body.alphaVantageApiKey).trim() : undefined;

    const settings = (await FileManager.getSettings()) || {
      platformName: "EXENOS",
      maintenanceMode: false,
      maxUsers: 50,
      defaultTimeframe: "15m",
      defaultSymbol: "EURUSD",
      aiProvider: "OmniRoute" as const,
      aiModel: "default",
      telegramEnabled: false,
    };

    if (twelveDataApiKey !== undefined) {
      settings.twelveDataApiKey = twelveDataApiKey;
    }
    if (alphaVantageApiKey !== undefined) {
      settings.alphaVantageApiKey = alphaVantageApiKey;
    }

    await FileManager.saveSettings(settings);

    // Test Twelve Data API Key if provided
    let testSuccess = true;
    let testError: string | undefined;

    if (twelveDataApiKey) {
      try {
        const testRes = await fetch(
          `https://api.twelvedata.com/quote?symbol=EUR/USD&apikey=${twelveDataApiKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        const testJson = await testRes.json();
        if (testJson.status === "error") {
          testSuccess = false;
          testError = testJson.message || "Invalid Twelve Data API Key";
        }
      } catch {
        // network issue in offline environment, keep key saved
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: testSuccess
          ? "Market data provider API key saved successfully."
          : `API key saved, but test returned: ${testError}`,
        activeProvider: twelveDataApiKey ? "Twelve Data" : "Yahoo Finance",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving market data config";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
