import fs from "fs/promises";
import path from "path";
import os from "os";
import { IStorageProvider, StorageFileName } from "./types";
import { getEnv } from "@/config/env";

// In-memory fallback map for serverless execution environments
const globalStorageMap = (globalThis as unknown as { __EXENOS_MEM_STORAGE__?: Map<string, string> });
if (!globalStorageMap.__EXENOS_MEM_STORAGE__) {
  globalStorageMap.__EXENOS_MEM_STORAGE__ = new Map<string, string>();
}

export class LocalFileStorageProvider implements IStorageProvider {
  public name = "LocalFileStorage";
  private primaryDir: string;
  private fallbackDir: string;

  constructor(customDir?: string) {
    const env = getEnv();
    this.primaryDir = customDir || path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR || "./storage");
    this.fallbackDir = path.join(os.tmpdir(), "exenos_storage");
  }

  private async getWritableDir(): Promise<string> {
    try {
      await fs.mkdir(this.primaryDir, { recursive: true });
      // Test write permission
      const testFile = path.join(this.primaryDir, `.test_${Date.now()}`);
      await fs.writeFile(testFile, "ok", "utf-8");
      await fs.unlink(testFile);
      return this.primaryDir;
    } catch {
      await fs.mkdir(this.fallbackDir, { recursive: true });
      return this.fallbackDir;
    }
  }

  private async getFilePath(filename: StorageFileName): Promise<string> {
    const dir = await this.getWritableDir();
    return path.join(dir, filename);
  }

  async exists(filename: StorageFileName): Promise<boolean> {
    if (globalStorageMap.__EXENOS_MEM_STORAGE__?.has(filename)) {
      return true;
    }
    try {
      const filePath = await this.getFilePath(filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readJson<T>(filename: StorageFileName): Promise<T | null> {
    // 1. Try reading from memory cache
    const memData = globalStorageMap.__EXENOS_MEM_STORAGE__?.get(filename);
    if (memData) {
      try {
        return JSON.parse(memData) as T;
      } catch {
        // continue
      }
    }

    // 2. Try reading from primary disk directory
    try {
      const primaryPath = path.join(this.primaryDir, filename);
      const data = await fs.readFile(primaryPath, "utf-8");
      const parsed = JSON.parse(data) as T;
      globalStorageMap.__EXENOS_MEM_STORAGE__?.set(filename, data);
      return parsed;
    } catch {
      // 3. Try reading from fallback /tmp directory
      try {
        const fallbackPath = path.join(this.fallbackDir, filename);
        const data = await fs.readFile(fallbackPath, "utf-8");
        const parsed = JSON.parse(data) as T;
        globalStorageMap.__EXENOS_MEM_STORAGE__?.set(filename, data);
        return parsed;
      } catch {
        return null;
      }
    }
  }

  async writeJson<T>(filename: StorageFileName, data: T): Promise<boolean> {
    const jsonString = JSON.stringify(data, null, 2);
    // Always store in global memory map
    globalStorageMap.__EXENOS_MEM_STORAGE__?.set(filename, jsonString);

    // Write to disk
    try {
      const filePath = await this.getFilePath(filename);
      await fs.writeFile(filePath, jsonString, "utf-8");
      return true;
    } catch (error) {
      console.warn(`[LocalFileStorage] Disk write failed for ${filename}, retained in memory:`, error);
      return true;
    }
  }

  async backup(filename: StorageFileName): Promise<string | null> {
    try {
      const dir = await this.getWritableDir();
      const backupDir = path.join(dir, "backups");
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `${filename}.${timestamp}.bak`);

      const data = await this.readJson(filename);
      if (data) {
        await fs.writeFile(backupPath, JSON.stringify(data, null, 2), "utf-8");
        return backupPath;
      }
      return null;
    } catch {
      return null;
    }
  }

  async initializeDefaults(): Promise<void> {
    await this.getWritableDir();
  }
}
