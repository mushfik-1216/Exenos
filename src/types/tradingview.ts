export type TVConnectionType = "session_id" | "cookie";

export type TVConnectionStatus = "connected" | "disconnected" | "error" | "validating";

export interface TVCredentials {
  connectionType: TVConnectionType;
  credentialValue: string;
  rememberSession: boolean;
  removeOnExit: boolean;
}

export interface TVStoredCredential {
  userId: string;
  connectionType: TVConnectionType;
  encryptedValue: string;
  iv: string;
  authTag: string;
  rememberSession: boolean;
  removeOnExit: boolean;
  updatedAt: string;
}

export interface TVStatusResponse {
  status: TVConnectionStatus;
  connectionType?: TVConnectionType;
  lastValidated?: string;
  username?: string;
  errorMessage?: string;
}
