import { IStorageProvider } from "./types";
import { getEnv } from "@/config/env";
import { GoogleDriveStorageProvider } from "./google-drive-provider";

let instance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (instance) return instance;

  const env = getEnv();
  const driveProvider = new GoogleDriveStorageProvider();

  // If driver explicitly set to google-drive or credentials available, use Google Drive with fallback
  if (env.STORAGE_DRIVER === "google-drive" || env.GOOGLE_DRIVE_CLIENT_EMAIL) {
    instance = driveProvider;
  } else {
    // Default to GoogleDriveProvider which internally wraps LocalFileStorageProvider gracefully
    instance = driveProvider;
  }

  return instance;
}
