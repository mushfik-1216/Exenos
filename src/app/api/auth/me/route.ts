import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const users = await FileManager.getUsers();
    const user = users.find((u) => u.id === session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
