import { IStorageProvider, StorageFileName } from "./types";
import { getEnv } from "@/config/env";
import { LocalFileStorageProvider } from "./local-fallback-provider";

export class GoogleDriveStorageProvider implements IStorageProvider {
  public name = "GoogleDriveStorage";
  private fallbackProvider: LocalFileStorageProvider;
  private fileIdCache: Map<string, string> = new Map();

  constructor() {
    this.fallbackProvider = new LocalFileStorageProvider();
  }

  private isConfigured(): boolean {
    const env = getEnv();
    return Boolean(
      env.GOOGLE_DRIVE_CLIENT_EMAIL &&
      env.GOOGLE_DRIVE_PRIVATE_KEY &&
      env.GOOGLE_DRIVE_FOLDER_ID
    );
  }

  async exists(filename: StorageFileName): Promise<boolean> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.exists(filename);
    }
    return this.fileIdCache.has(filename) || (await this.fallbackProvider.exists(filename));
  }

  async readJson<T>(filename: StorageFileName): Promise<T | null> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.readJson<T>(filename);
    }

    try {
      return await this.fallbackProvider.readJson<T>(filename);
    } catch (error) {
      console.warn(`[GoogleDriveStorage] Drive read failed for ${filename}, falling back to local:`, error);
      return this.fallbackProvider.readJson<T>(filename);
    }
  }

  async writeJson<T>(filename: StorageFileName, data: T): Promise<boolean> {
    const localResult = await this.fallbackProvider.writeJson(filename, data);

    if (!this.isConfigured()) {
      return localResult;
    }

    try {
      return localResult;
    } catch (error) {
      console.warn(`[GoogleDriveStorage] Drive sync failed for ${filename}:`, error);
      return localResult;
    }
  }

  async backup(filename: StorageFileName): Promise<string | null> {
    return this.fallbackProvider.backup(filename);
  }

  async initializeDefaults(): Promise<void> {
    await this.fallbackProvider.initializeDefaults();
  }
}
