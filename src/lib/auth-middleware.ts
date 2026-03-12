import { NextRequest } from "next/server";
import { validateApiKey } from "./api-auth";
import { verifySessionFromRequest } from "./session";

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  if (validateApiKey(request)) return true;
  return verifySessionFromRequest(request);
}

export async function requireSession(request: NextRequest): Promise<boolean> {
  return verifySessionFromRequest(request);
}
