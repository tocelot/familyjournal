import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    const instance = createDb();
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});
