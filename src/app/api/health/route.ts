import { NextResponse } from "next/server";
import { FileManager } from "@/lib/storage/file-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let storageStatus = "healthy";

  try {
    const system = await FileManager.getSystemData();
    system.lastHealthCheck = new Date().toISOString();
    await FileManager.saveSystemData(system);
  } catch {
    storageStatus = "degraded";
  }

  return NextResponse.json(
    {
      status: storageStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      services: {
        storage: storageStatus,
        api: "healthy",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
