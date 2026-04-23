import { NextResponse } from "next/server";
import { getSql, hasDatabaseUrl } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  const databaseConfigured = hasDatabaseUrl();

  let databaseReachable = false;
  let databaseMode: "postgres" | "file" = "file";

  if (databaseConfigured) {
    databaseMode = "postgres";
    try {
      const sql = getSql();
      await sql`SELECT 1 AS ok`;
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }

  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const ok = databaseMode === "file" || (databaseMode === "postgres" && databaseReachable);

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        databaseConfigured,
        databaseMode,
        databaseReachable,
        blobConfigured,
      },
      responseTimeMs: Date.now() - startedAt,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
