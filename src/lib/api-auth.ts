import { NextRequest } from "next/server";

export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const apiKey = process.env.OPENCLAW_API_KEY;

  if (!apiKey) return false;
  return token === apiKey;
}
