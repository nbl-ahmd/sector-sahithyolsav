import { NextRequest, NextResponse } from "next/server";
import { FAMILY_FRAME_TEMPLATE_ID, UNIT_LIST } from "@/lib/constants";
import { recordFraming } from "@/lib/store";
import { UnitName } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FAMILY_NAME_LENGTH = 120;

function normalizeFamilyName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, MAX_FAMILY_NAME_LENGTH);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      templateId?: string;
      unit?: UnitName;
      frameId?: string;
      familyName?: string;
    };

    const templateId = body.templateId ?? FAMILY_FRAME_TEMPLATE_ID;
    const unit = body.unit;
    const frameId = typeof body.frameId === "string" ? body.frameId.trim() : "";
    const familyName = normalizeFamilyName(body.familyName);

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
      familyName,
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Could not record framing", error);
    return NextResponse.json({ error: "Could not record framing" }, { status: 500 });
  }
}
