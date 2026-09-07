import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST() {
  const response = NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  response.cookies.set({
    name: APP_CONFIG.SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
