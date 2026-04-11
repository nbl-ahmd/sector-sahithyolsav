import { NextRequest, NextResponse } from "next/server";
import { FAMILY_FRAME_TEMPLATE_ID } from "@/lib/constants";
import { getLeaderboard, getTemplate, saveTemplate } from "@/lib/store";
import { TemplateConfig } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const [template, leaderboard] = await Promise.all([
    getTemplate(FAMILY_FRAME_TEMPLATE_ID),
    getLeaderboard(FAMILY_FRAME_TEMPLATE_ID),
  ]);

  return NextResponse.json({ template, leaderboard });
}

export async function PUT(req: NextRequest) {
  try {
    const payload = (await req.json()) as TemplateConfig;
    if (!payload?.id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }
    if (!payload?.frames?.length) {
      return NextResponse.json({ error: "At least one frame is required" }, { status: 400 });
    }

    const saved = await saveTemplate(payload);
    return NextResponse.json({ template: saved });
  } catch {
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
