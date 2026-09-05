import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { hashPassword } from "@/lib/auth/password";
import { APP_CONFIG } from "@/config/constants";
import { User, UserRole } from "@/types/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      users: safeUsers,
      maxUsers: APP_CONFIG.MAX_USERS,
      currentCount: safeUsers.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load users";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role } = body as {
      username?: string;
      password?: string;
      role?: UserRole;
    };

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const users = await FileManager.getUsers();

    if (users.length >= APP_CONFIG.MAX_USERS) {
      return NextResponse.json(
        {
          success: false,
          error: `Terminal user limit reached. Maximum ${APP_CONFIG.MAX_USERS} accounts allowed.`,
        },
        { status: 400 }
      );
    }

    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" is already taken` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole: UserRole = role === "admin" ? "admin" : "trader";

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      role: assignedRole,
      password_hash: hashedPassword,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    users.push(newUser);
    await FileManager.saveUsers(users);

    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      isActive: newUser.isActive,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: `User "${cleanUsername}" created successfully as ${assignedRole}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own active administrator account" },
        { status: 400 }
      );
    }

    const users = await FileManager.getUsers();
    const targetIndex = users.findIndex((u) => u.id === targetUserId);

    if (targetIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const deletedUsername = users[targetIndex].username;
    users.splice(targetIndex, 1);
    await FileManager.saveUsers(users);

    return NextResponse.json({
      success: true,
      message: `User account "${deletedUsername}" has been removed.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
