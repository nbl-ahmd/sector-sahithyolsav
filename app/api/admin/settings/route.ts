import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";
import { getAppSettings, setAppSettings } from "@/lib/store";
import { AppSettings } from "@/lib/types";

export const runtime = "nodejs";

function normalizePayload(input: unknown): AppSettings {
  if (!input || typeof input !== "object") {
    return { sahithyolsavDate: null };
  }

  const payload = input as Partial<AppSettings>;
  const rawDate = typeof payload.sahithyolsavDate === "string" ? payload.sahithyolsavDate.trim() : "";
  if (!rawDate) {
    return { sahithyolsavDate: null };
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return { sahithyolsavDate: null };
  }

  return { sahithyolsavDate: parsed.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to load app settings", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = normalizePayload(await req.json());
    const settings = await setAppSettings(payload);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update app settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
