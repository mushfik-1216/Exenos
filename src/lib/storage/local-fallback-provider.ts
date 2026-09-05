import fs from "fs/promises";
import path from "path";
import { IStorageProvider, StorageFileName } from "./types";
import { getEnv } from "@/config/env";

export class LocalFileStorageProvider implements IStorageProvider {
  public name = "LocalFileStorage";
  private storageDir: string;

  constructor(customDir?: string) {
    const env = getEnv();
    this.storageDir = customDir || path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR || "./storage");
  }

  private getFilePath(filename: StorageFileName): string {
    return path.join(this.storageDir, filename);
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch {
      // Ignore if directory already exists
    }
  }

  async exists(filename: StorageFileName): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(filename));
      return true;
    } catch {
      return false;
    }
  }

  async readJson<T>(filename: StorageFileName): Promise<T | null> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(filename);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async writeJson<T>(filename: StorageFileName, data: T): Promise<boolean> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(filename);
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
      await fs.rename(tempPath, filePath);
      return true;
    } catch (error) {
      console.error(`[LocalFileStorage] Failed to write ${filename}:`, error);
      return false;
    }
  }

  async backup(filename: StorageFileName): Promise<string | null> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(filename);
      const exists = await this.exists(filename);
      if (!exists) return null;

      const backupDir = path.join(this.storageDir, "backups");
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `${filename}.${timestamp}.bak`);

      await fs.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error(`[LocalFileStorage] Failed to backup ${filename}:`, error);
      return null;
    }
  }

  async initializeDefaults(): Promise<void> {
    await this.ensureDirectory();
  }
}
