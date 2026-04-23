import { NextRequest, NextResponse } from "next/server";
import { getCurrentGlobalCounter, getTemplate } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing template id" }, { status: 400 });
    }

    const [template, currentCounter] = await Promise.all([
      getTemplate(id),
      getCurrentGlobalCounter(),
    ]);

    return NextResponse.json({
      template,
      nextCounter: currentCounter + 1,
    });
  } catch (error) {
    console.error("Failed to load template", error);
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
  }
}
