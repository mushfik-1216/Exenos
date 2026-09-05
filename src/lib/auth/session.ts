import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionData, UserRole } from "@/types/auth";
import { getEnv } from "@/config/env";
import { APP_CONFIG } from "@/config/constants";

function getSecretKey(): Uint8Array {
  const env = getEnv();
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createSessionToken(data: { userId: string; username: string; role: UserRole }): Promise<string> {
  const secretKey = getSecretKey();
  const expiresAt = Math.floor(Date.now() / 1000) + APP_CONFIG.SESSION_EXPIRY_SECONDS;

  return await new SignJWT({
    userId: data.userId,
    username: data.username,
    role: data.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as UserRole,
      expiresAt: (payload.exp ?? 0) as number,
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(APP_CONFIG.SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}
