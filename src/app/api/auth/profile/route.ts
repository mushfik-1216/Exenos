import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, createSessionToken } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { APP_CONFIG } from "@/config/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();
    const currentPassword = body.currentPassword ? String(body.currentPassword).trim() : "";
    const newUsername = body.newUsername ? String(body.newUsername).trim() : "";
    const newPassword = body.newPassword ? String(body.newPassword).trim() : "";

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required to authorize changes" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();
    const userIndex = users.findIndex((u) => u.id === session.userId);

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const user = users[userIndex];

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password. Verification failed." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let usernameChanged = false;

    // Handle username change
    if (newUsername && newUsername.toLowerCase() !== user.username.toLowerCase()) {
      if (newUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters long" },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const existing = users.find(
        (u) => u.id !== user.id && u.username.toLowerCase() === newUsername.toLowerCase()
      );
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Username "${newUsername}" is already taken` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      user.username = newUsername;
      usernameChanged = true;
    }

    // Handle password change
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long" },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      user.password_hash = await hashPassword(newPassword);
    }

    users[userIndex] = user;
    await FileManager.saveUsers(users);

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
        message: "Account credentials updated successfully.",
        user: safeUser,
      },
      { headers: NO_CACHE_HEADERS }
    );

    if (usernameChanged) {
      const token = await createSessionToken({
        userId: user.id,
        username: user.username,
        role: user.role,
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
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
