import { getStorageProvider } from "./storage-factory";
import { User } from "@/types/auth";
import { SystemSettings } from "@/types/settings";
import { JournalEntry } from "@/types/journal";
import { APP_CONFIG } from "@/config/constants";
import { hashPassword } from "@/lib/auth/password";
import { StorageFileName } from "./types";

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const CACHE_TTL_MS = 2 * 1000; // 2 seconds fast cache to allow instant multi-device sync

export class FileManager {
  private static provider = getStorageProvider();
  private static memoryCache = new Map<StorageFileName, CacheEntry<unknown>>();
  private static isInitialized = false;

  private static getCached<T>(filename: StorageFileName): T | null {
    const entry = this.memoryCache.get(filename);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.memoryCache.delete(filename);
      return null;
    }
    return JSON.parse(JSON.stringify(entry.data)) as T;
  }

  private static setCached<T>(filename: StorageFileName, data: T): void {
    this.memoryCache.set(filename, {
      data: JSON.parse(JSON.stringify(data)),
      cachedAt: Date.now(),
    });
  }

  static invalidateCache(filename?: StorageFileName): void {
    if (filename) {
      this.memoryCache.delete(filename);
    } else {
      this.memoryCache.clear();
    }
  }

  static async initDefaultFiles(): Promise<void> {
    if (this.isInitialized) return;

    await Promise.all([
      (async () => {
        const users = await this.provider.readJson<User[]>("users.json");
        if (!users || !Array.isArray(users) || users.length === 0) {
          const defaultAdminPassword = "AdminPassword123!";
          const hashedPassword = await hashPassword(defaultAdminPassword);
          const defaultUsers: User[] = [
            {
              id: "user_admin_001",
              username: "admin",
              role: "admin",
              password_hash: hashedPassword,
              createdAt: new Date().toISOString(),
              isActive: true,
            },
          ];
          await this.provider.writeJson("users.json", defaultUsers);
          this.setCached("users.json", defaultUsers);
        } else {
          this.setCached("users.json", users);
        }
      })(),
      (async () => {
        const settings = await this.provider.readJson<SystemSettings>("settings.json");
        if (!settings) {
          const defaultSettings: SystemSettings = {
            platformName: APP_CONFIG.NAME,
            maintenanceMode: false,
            maxUsers: APP_CONFIG.MAX_USERS,
            defaultTimeframe: APP_CONFIG.DEFAULT_TIMEFRAME,
            defaultSymbol: APP_CONFIG.DEFAULT_SYMBOL,
            aiProvider: "OmniRoute",
            aiModel: "default",
            telegramEnabled: false,
          };
          await this.provider.writeJson("settings.json", defaultSettings);
          this.setCached("settings.json", defaultSettings);
        } else {
          this.setCached("settings.json", settings);
        }
      })(),
      (async () => {
        const trades = await this.provider.readJson<unknown[]>("trades.json");
        if (!trades) {
          await this.provider.writeJson("trades.json", []);
          this.setCached("trades.json", []);
        } else {
          this.setCached("trades.json", trades);
        }
      })(),
      (async () => {
        const journal = await this.provider.readJson<JournalEntry[]>("journal.json");
        if (!journal) {
          await this.provider.writeJson("journal.json", []);
          this.setCached("journal.json", []);
        } else {
          this.setCached("journal.json", journal);
        }
      })(),
      (async () => {
        const history = await this.provider.readJson<unknown[]>("history.json");
        if (!history) {
          await this.provider.writeJson("history.json", []);
          this.setCached("history.json", []);
        } else {
          this.setCached("history.json", history);
        }
      })(),
      (async () => {
        const system = await this.provider.readJson<Record<string, unknown>>("system.json");
        if (!system) {
          const defaultSystem = {
            version: "1.0.0",
            initializedAt: new Date().toISOString(),
            lastHealthCheck: new Date().toISOString(),
            activeSessions: 0,
            tvConnections: {},
          };
          await this.provider.writeJson("system.json", defaultSystem);
          this.setCached("system.json", defaultSystem);
        } else {
          this.setCached("system.json", system);
        }
      })(),
    ]);

    this.isInitialized = true;
  }

  static async getUsers(): Promise<User[]> {
    const cached = this.getCached<User[]>("users.json");
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const data = (await this.provider.readJson<User[]>("users.json")) || [];
    if (data.length > 0) {
      this.setCached("users.json", data);
      return JSON.parse(JSON.stringify(data));
    }
    await this.initDefaultFiles();
    const rechecked = (await this.provider.readJson<User[]>("users.json")) || [];
    this.setCached("users.json", rechecked);
    return JSON.parse(JSON.stringify(rechecked));
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    if (users.length > APP_CONFIG.MAX_USERS) {
      throw new Error(`Maximum ${APP_CONFIG.MAX_USERS} users allowed.`);
    }
    this.invalidateCache("users.json");
    const res = await this.provider.writeJson("users.json", users);
    this.setCached("users.json", users);
    return res;
  }

  static async getSettings(): Promise<SystemSettings | null> {
    const cached = this.getCached<SystemSettings>("settings.json");
    if (cached) return cached;
    const data = await this.provider.readJson<SystemSettings>("settings.json");
    if (data) this.setCached("settings.json", data);
    return data;
  }

  static async saveSettings(settings: SystemSettings): Promise<boolean> {
    this.invalidateCache("settings.json");
    const res = await this.provider.writeJson("settings.json", settings);
    this.setCached("settings.json", settings);
    return res;
  }

  static async getJournal(): Promise<JournalEntry[]> {
    const cached = this.getCached<JournalEntry[]>("journal.json");
    if (cached) return cached;
    const data = (await this.provider.readJson<JournalEntry[]>("journal.json")) || [];
    this.setCached("journal.json", data);
    return data;
  }

  static async saveJournal(entries: JournalEntry[]): Promise<boolean> {
    this.invalidateCache("journal.json");
    const res = await this.provider.writeJson("journal.json", entries);
    this.setCached("journal.json", entries);
    return res;
  }

  static async getSystemData(): Promise<Record<string, unknown>> {
    const cached = this.getCached<Record<string, unknown>>("system.json");
    if (cached) return cached;
    const data = (await this.provider.readJson<Record<string, unknown>>("system.json")) || {};
    this.setCached("system.json", data);
    return data;
  }

  static async saveSystemData(data: Record<string, unknown>): Promise<boolean> {
    this.invalidateCache("system.json");
    const res = await this.provider.writeJson("system.json", data);
    this.setCached("system.json", data);
    return res;
  }
}
