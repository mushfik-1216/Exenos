import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/constants";

export async function POST() {
  const response = NextResponse.json({ success: true });
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
