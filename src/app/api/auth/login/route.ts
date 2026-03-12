import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const passwordHash = process.env.SITE_PASSWORD_HASH;
  if (!passwordHash) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const valid = await bcrypt.compare(body.password, passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ success: true });
  const cookie = sessionCookieOptions(token);
  response.cookies.set(cookie);

  return response;
}
