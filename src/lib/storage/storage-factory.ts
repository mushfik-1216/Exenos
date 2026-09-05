import { IStorageProvider } from "./types";
import { getEnv } from "@/config/env";
import { GoogleDriveStorageProvider } from "./google-drive-provider";
import { LocalFileStorageProvider } from "./local-fallback-provider";

let instance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (instance) return instance;

  const env = getEnv();
  if (env.STORAGE_DRIVER === "google-drive" && env.GOOGLE_DRIVE_FOLDER_ID) {
    instance = new GoogleDriveStorageProvider();
  } else {
    instance = new LocalFileStorageProvider();
  }

  return instance;
}
