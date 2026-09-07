import fs from "fs";
import path from "path";
import { importPKCS8, SignJWT } from "jose";
import { IStorageProvider, StorageFileName } from "./types";
import { getEnv } from "@/config/env";
import { LocalFileStorageProvider } from "./local-fallback-provider";

interface DriveCredentials {
  clientEmail: string;
  privateKey: string;
  folderId?: string;
}

export class GoogleDriveStorageProvider implements IStorageProvider {
  public name = "GoogleDriveStorage";
  private fallbackProvider: LocalFileStorageProvider;
  private fileIdCache: Map<string, string> = new Map();
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private credentials: DriveCredentials | null = null;

  constructor() {
    this.fallbackProvider = new LocalFileStorageProvider();
    this.loadCredentials();
  }

  private loadCredentials(): void {
    const env = getEnv();

    // 1. Try environment variables
    if (env.GOOGLE_DRIVE_CLIENT_EMAIL && env.GOOGLE_DRIVE_PRIVATE_KEY) {
      this.credentials = {
        clientEmail: env.GOOGLE_DRIVE_CLIENT_EMAIL,
        privateKey: env.GOOGLE_DRIVE_PRIVATE_KEY,
        folderId: env.GOOGLE_DRIVE_FOLDER_ID,
      };
      return;
    }

    // 2. Try JSON service account key from environment
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        if (parsed.client_email && parsed.private_key) {
          this.credentials = {
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key,
            folderId: env.GOOGLE_DRIVE_FOLDER_ID,
          };
          return;
        }
      } catch {
        // ignore
      }
    }

    // 3. Try reading local service account file if available
    try {
      const rootDir = process.cwd();
      const files = fs.readdirSync(rootDir);
      const saFile = files.find(
        (f) => (f.startsWith("exenos-") || f.startsWith("service-account")) && f.endsWith(".json")
      );
      if (saFile) {
        const content = fs.readFileSync(path.join(rootDir, saFile), "utf-8");
        const parsed = JSON.parse(content);
        if (parsed.client_email && parsed.private_key) {
          this.credentials = {
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key,
            folderId: env.GOOGLE_DRIVE_FOLDER_ID,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  private isConfigured(): boolean {
    return Boolean(this.credentials?.clientEmail && this.credentials?.privateKey);
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.credentials) return null;
    const now = Date.now();

    if (this.accessToken && this.tokenExpiresAt > now + 60 * 1000) {
      return this.accessToken;
    }

    try {
      const cleanKey = this.credentials.privateKey.replace(/\\n/g, "\n");
      const privateKey = await importPKCS8(cleanKey, "RS256");
      const nowSec = Math.floor(now / 1000);

      const jwt = await new SignJWT({
        scope: "https://www.googleapis.com/auth/drive",
      })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuer(this.credentials.clientEmail)
        .setSubject(this.credentials.clientEmail)
        .setAudience("https://oauth2.googleapis.com/token")
        .setIssuedAt(nowSec)
        .setExpirationTime(nowSec + 3600)
        .sign(privateKey);

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`OAuth2 HTTP ${response.status}`);
      }

      const json = await response.json();
      this.accessToken = json.access_token;
      this.tokenExpiresAt = now + (json.expires_in || 3600) * 1000;
      return this.accessToken;
    } catch (err) {
      console.warn("[GoogleDriveStorage] Token generation error:", err);
      return null;
    }
  }

  private async findFileId(filename: StorageFileName, token: string): Promise<string | null> {
    if (this.fileIdCache.has(filename)) {
      return this.fileIdCache.get(filename)!;
    }

    try {
      let query = `name='${filename}' and trashed=false`;
      if (this.credentials?.folderId) {
        query += ` and '${this.credentials.folderId}' in parents`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const file = json.files?.[0];
      if (file?.id) {
        this.fileIdCache.set(filename, file.id);
        return file.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  async exists(filename: StorageFileName): Promise<boolean> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.exists(filename);
    }

    try {
      const token = await this.getAccessToken();
      if (!token) return this.fallbackProvider.exists(filename);
      const fileId = await this.findFileId(filename, token);
      return Boolean(fileId) || (await this.fallbackProvider.exists(filename));
    } catch {
      return this.fallbackProvider.exists(filename);
    }
  }

  async readJson<T>(filename: StorageFileName): Promise<T | null> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.readJson<T>(filename);
    }

    try {
      const token = await this.getAccessToken();
      if (!token) {
        return await this.fallbackProvider.readJson<T>(filename);
      }

      const fileId = await this.findFileId(filename, token);
      if (!fileId) {
        return await this.fallbackProvider.readJson<T>(filename);
      }

      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return await this.fallbackProvider.readJson<T>(filename);
      }

      const data = (await response.json()) as T;
      // Sync to local fallback to keep local warm
      await this.fallbackProvider.writeJson(filename, data);
      return data;
    } catch (error) {
      console.warn(`[GoogleDriveStorage] Drive read failed for ${filename}, falling back to local:`, error);
      return await this.fallbackProvider.readJson<T>(filename);
    }
  }

  async writeJson<T>(filename: StorageFileName, data: T): Promise<boolean> {
    // Write locally first
    const localResult = await this.fallbackProvider.writeJson(filename, data);

    if (!this.isConfigured()) {
      return localResult;
    }

    try {
      const token = await this.getAccessToken();
      if (!token) return localResult;

      const fileId = await this.findFileId(filename, token);
      const content = JSON.stringify(data, null, 2);

      if (fileId) {
        // Update existing file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: content,
          signal: AbortSignal.timeout(6000),
        });
      } else {
        // Create new file
        const metadata: Record<string, unknown> = {
          name: filename,
          mimeType: "application/json",
        };
        if (this.credentials?.folderId) {
          metadata.parents = [this.credentials.folderId];
        }

        const boundary = "-------314159265358979323846";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: application/json\r\n\r\n" +
          content +
          closeDelimiter;

        const createUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
          signal: AbortSignal.timeout(6000),
        });

        if (createRes.ok) {
          const createJson = await createRes.json();
          if (createJson.id) {
            this.fileIdCache.set(filename, createJson.id);
          }
        }
      }

      return true;
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
