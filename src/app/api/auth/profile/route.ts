import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, createSessionToken } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { APP_CONFIG } from "@/config/constants";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required to confirm changes" },
        { status: 400 }
      );
    }

    const users = await FileManager.getUsers();
    const userIndex = users.findIndex((u) => u.id === session.userId);

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = users[userIndex];

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password" },
        { status: 400 }
      );
    }

    let usernameChanged = false;

    // Handle username change
    if (newUsername && newUsername.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = newUsername.trim();
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters long" },
          { status: 400 }
        );
      }

      const existing = users.find(
        (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Username "${cleanUsername}" is already taken` },
          { status: 400 }
        );
      }

      user.username = cleanUsername;
      usernameChanged = true;
    }

    // Handle password change
    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long" },
          { status: 400 }
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

    const response = NextResponse.json({
      success: true,
      message: "Profile credentials updated successfully",
      user: safeUser,
    });

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
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
