import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "./lib/session";
import { validateApiKey } from "./lib/api-auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];
const API_KEY_PATHS = ["/api/entries", "/api/photos/upload"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (
    API_KEY_PATHS.some((p) => pathname === p) &&
    request.method === "POST" &&
    validateApiKey(request)
  ) {
    return NextResponse.next();
  }

  const hasSession = await verifySessionFromRequest(request);
  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
