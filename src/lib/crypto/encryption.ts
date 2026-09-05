import crypto from "crypto";
import { getEnv } from "@/config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const env = getEnv();
  const secret = env.ENCRYPTION_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encryptString(text: string): EncryptedPayload {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptString(payload: EncryptedPayload): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(payload.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
