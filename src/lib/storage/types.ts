export type StorageFileName =
  | "users.json"
  | "settings.json"
  | "trades.json"
  | "journal.json"
  | "history.json"
  | "system.json";

export interface IStorageProvider {
  name: string;
  readJson<T>(filename: StorageFileName): Promise<T | null>;
  writeJson<T>(filename: StorageFileName, data: T): Promise<boolean>;
  exists(filename: StorageFileName): Promise<boolean>;
  backup(filename: StorageFileName): Promise<string | null>;
  initializeDefaults(): Promise<void>;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
