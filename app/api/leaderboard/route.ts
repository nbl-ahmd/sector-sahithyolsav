import { NextRequest, NextResponse } from "next/server";
import { FAMILY_FRAME_TEMPLATE_ID } from "@/lib/constants";
import { getLeaderboard } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const templateId =
      req.nextUrl.searchParams.get("templateId") ?? FAMILY_FRAME_TEMPLATE_ID;
    const snapshot = await getLeaderboard(templateId);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Failed to load leaderboard", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
