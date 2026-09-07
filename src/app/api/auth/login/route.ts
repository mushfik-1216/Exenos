import { NextResponse } from "next/server";
import { FileManager } from "@/lib/storage/file-manager";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { APP_CONFIG } from "@/config/constants";
import { LoginCredentials } from "@/types/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginCredentials;
    const cleanUsername = body.username ? String(body.username).trim() : "";
    const cleanPassword = body.password ? String(body.password).trim() : "";

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const isMatch = await verifyPassword(cleanPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    await FileManager.saveUsers(users);

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
    };

    const response = NextResponse.json(
      {
        success: true,
        user: safeUser,
      },
      { headers: NO_CACHE_HEADERS }
    );

    response.cookies.set({
      name: APP_CONFIG.SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: APP_CONFIG.SESSION_EXPIRY_SECONDS,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal authentication error";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
