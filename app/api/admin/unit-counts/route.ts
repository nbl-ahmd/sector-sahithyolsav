import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";
import { FAMILY_FRAME_TEMPLATE_ID, UNIT_LIST } from "@/lib/constants";
import {
  getCurrentGlobalCounter,
  getLeaderboard,
  getManualUnitCounts,
  setManualUnitCounts,
} from "@/lib/store";
import { ManualUnitCountMap, UnitName } from "@/lib/types";

export const runtime = "nodejs";

function normalizeCount(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
}

function normalizeManualCounts(input: unknown): ManualUnitCountMap {
  const rows = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return Object.fromEntries(
    UNIT_LIST.map((unit) => [unit, normalizeCount(rows[unit])]),
  ) as ManualUnitCountMap;
}

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateId =
      req.nextUrl.searchParams.get("templateId") ?? FAMILY_FRAME_TEMPLATE_ID;
    const manualUnitCounts = await getManualUnitCounts(templateId);
    return NextResponse.json({ manualUnitCounts });
  } catch (error) {
    console.error("Failed to load manual unit counts", error);
    return NextResponse.json(
      { error: "Failed to load manual unit counts" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as {
      templateId?: string;
      counts?: Partial<Record<UnitName, number>>;
    };

    const templateId = payload.templateId ?? FAMILY_FRAME_TEMPLATE_ID;
    const normalizedCounts = normalizeManualCounts(payload.counts);

    const manualUnitCounts = await setManualUnitCounts({
      templateId,
      counts: normalizedCounts,
    });

    const [leaderboard, currentCounter] = await Promise.all([
      getLeaderboard(templateId),
      getCurrentGlobalCounter(),
    ]);

    return NextResponse.json({
      manualUnitCounts,
      leaderboard,
      nextCounter: currentCounter + 1,
    });
  } catch (error) {
    console.error("Failed to update manual unit counts", error);
    return NextResponse.json(
      { error: "Failed to update manual unit counts" },
      { status: 500 },
    );
  }
}
