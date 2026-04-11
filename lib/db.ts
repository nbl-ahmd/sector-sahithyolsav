import { neon } from "@neondatabase/serverless";

let cachedConnectionUrl: string | null = null;
let cachedSql: ReturnType<typeof neon> | null = null;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!cachedSql || cachedConnectionUrl !== connectionUrl) {
    cachedSql = neon(connectionUrl);
    cachedConnectionUrl = connectionUrl;
  }

  return cachedSql;
}
