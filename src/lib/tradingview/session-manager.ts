import { TVConnectionType, TVStoredCredential, TVStatusResponse } from "@/types/tradingview";
import { encryptString, decryptString, EncryptedPayload } from "@/lib/crypto/encryption";
import { FileManager } from "@/lib/storage/file-manager";

export class TVSessionManager {
  static async saveCredentials(
    userId: string,
    connectionType: TVConnectionType,
    credentialValue: string,
    rememberSession: boolean,
    removeOnExit: boolean
  ): Promise<boolean> {
    const encrypted = encryptString(credentialValue);
    const systemData = await FileManager.getSystemData();
    const tvConnections = (systemData.tvConnections as Record<string, TVStoredCredential>) || {};

    tvConnections[userId] = {
      userId,
      connectionType,
      encryptedValue: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      rememberSession,
      removeOnExit,
      updatedAt: new Date().toISOString(),
    };

    systemData.tvConnections = tvConnections;
    return await FileManager.saveSystemData(systemData);
  }

  static async getCredentials(userId: string): Promise<{ connectionType: TVConnectionType; value: string } | null> {
    const systemData = await FileManager.getSystemData();
    const tvConnections = (systemData.tvConnections as Record<string, TVStoredCredential>) || {};
    const cred = tvConnections[userId];
    if (!cred) return null;

    try {
      const payload: EncryptedPayload = {
        encrypted: cred.encryptedValue,
        iv: cred.iv,
        authTag: cred.authTag,
      };
      const decrypted = decryptString(payload);
      return {
        connectionType: cred.connectionType,
        value: decrypted,
      };
    } catch {
      return null;
    }
  }

  static async removeCredentials(userId: string): Promise<boolean> {
    const systemData = await FileManager.getSystemData();
    const tvConnections = (systemData.tvConnections as Record<string, TVStoredCredential>) || {};
    if (tvConnections[userId]) {
      delete tvConnections[userId];
      systemData.tvConnections = tvConnections;
      return await FileManager.saveSystemData(systemData);
    }
    return true;
  }

  static async getStatus(userId: string): Promise<TVStatusResponse> {
    const creds = await this.getCredentials(userId);
    if (!creds) {
      return { status: "disconnected" };
    }
    return {
      status: "connected",
      connectionType: creds.connectionType,
      lastValidated: new Date().toISOString(),
    };
  }
}
