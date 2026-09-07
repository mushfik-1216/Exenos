import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { hashPassword } from "@/lib/auth/password";
import { APP_CONFIG } from "@/config/constants";
import { User, UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();
    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      isActive: u.isActive,
    }));

    return NextResponse.json(
      {
        success: true,
        users: safeUsers,
        maxUsers: APP_CONFIG.MAX_USERS,
        currentCount: safeUsers.length,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load users";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    const cleanUsername = body.username ? String(body.username).trim() : "";
    const cleanPassword = body.password ? String(body.password).trim() : "";
    const role = body.role as UserRole;

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();

    if (users.length >= APP_CONFIG.MAX_USERS) {
      return NextResponse.json(
        {
          success: false,
          error: `Terminal user limit reached. Maximum ${APP_CONFIG.MAX_USERS} accounts allowed.`,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" is already registered` },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const hashedPassword = await hashPassword(cleanPassword);
    const assignedRole: UserRole = role === "admin" ? "admin" : "trader";

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      role: assignedRole,
      password_hash: hashedPassword,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedUsers = [...users, newUser];
    await FileManager.saveUsers(updatedUsers);

    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      isActive: newUser.isActive,
    };

    return NextResponse.json(
      {
        success: true,
        user: safeUser,
        message: `User "${cleanUsername}" created successfully as ${assignedRole}.`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own active administrator account" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();
    const targetUser = users.find((u) => u.id === targetUserId);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const updatedUsers = users.filter((u) => u.id !== targetUserId);
    await FileManager.saveUsers(updatedUsers);

    return NextResponse.json(
      {
        success: true,
        message: `User "${targetUser.username}" removed from terminal.`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    const targetUserId = body.userId ? String(body.userId).trim() : "";
    const newPassword = body.newPassword ? String(body.newPassword).trim() : "";

    if (!targetUserId || !newPassword) {
      return NextResponse.json(
        { success: false, error: "User ID and new password are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await FileManager.getUsers();
    const userIndex = users.findIndex((u) => u.id === targetUserId);

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const targetUser = users[userIndex];
    targetUser.password_hash = await hashPassword(newPassword);
    users[userIndex] = targetUser;

    await FileManager.saveUsers(users);

    return NextResponse.json(
      {
        success: true,
        message: `Password reset successfully for user "${targetUser.username}".`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
