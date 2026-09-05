import { NextResponse } from "next/server";
import { FileManager } from "@/lib/storage/file-manager";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { APP_CONFIG } from "@/config/constants";
import { LoginCredentials } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginCredentials;
    const cleanUsername = body.username ? String(body.username).trim() : "";
    const cleanPassword = body.password ? String(body.password).trim() : "";

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const users = await FileManager.getUsers();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(cleanPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
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

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
