export type UserRole = "admin" | "trader";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  password_hash: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface SessionData {
  userId: string;
  username: string;
  role: UserRole;
  expiresAt: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, "password_hash">;
  error?: string;
}
