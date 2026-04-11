import { NextRequest, NextResponse } from "next/server";
import { FAMILY_FRAME_TEMPLATE_ID, UNIT_LIST } from "@/lib/constants";
import { recordFraming } from "@/lib/store";
import { UnitName } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      templateId?: string;
      unit?: UnitName;
      frameId?: string;
    };

    const templateId = body.templateId ?? FAMILY_FRAME_TEMPLATE_ID;
    const unit = body.unit;
    const frameId = body.frameId;

    if (!unit || !UNIT_LIST.includes(unit)) {
      return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
    }
    if (!frameId) {
      return NextResponse.json({ error: "Frame id is required" }, { status: 400 });
    }

    const record = await recordFraming({
      templateId,
      unit,
      frameId,
    });

    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Could not record framing" }, { status: 500 });
  }
}
