import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";

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
      return NextResponse.json({ user: null }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const users = await FileManager.getUsers();
    const user = users.find((u) => u.id === session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isActive: user.isActive,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
