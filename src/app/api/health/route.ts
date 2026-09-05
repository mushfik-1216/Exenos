import { NextResponse } from "next/server";
import { FileManager } from "@/lib/storage/file-manager";
import { getStorageProvider } from "@/lib/storage/storage-factory";

export async function GET() {
  await FileManager.initDefaultFiles();
  const provider = getStorageProvider();

  return NextResponse.json({
    status: "healthy",
    platform: "EXENOS",
    version: "1.0.0",
    storageProvider: provider.name,
    timestamp: new Date().toISOString(),
  });
}
