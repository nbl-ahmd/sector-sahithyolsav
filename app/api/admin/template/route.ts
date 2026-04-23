import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";
import { FAMILY_FRAME_TEMPLATE_ID, getDefaultTemplate } from "@/lib/constants";
import { getLeaderboard, getManualUnitCounts, getTemplate, saveTemplate } from "@/lib/store";
import { FamilyTextLayout, ManualUnitCountMap, TemplateConfig, TextLayout } from "@/lib/types";

export const runtime = "nodejs";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const MAX_FRAMES_PER_TEMPLATE = 60;
const MAX_TEXT_LENGTH = 80;

function normalizeSafeString(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const next = value.trim();
  if (!next) {
    return fallback;
  }
  return next.slice(0, maxLength);
}

function isValidImageReference(value: string): boolean {
  if (value.startsWith("/")) {
    return true;
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  return false;
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const color = value.trim();
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
  const isRgb = /^rgba?\(/.test(color);
  return isHex || isRgb ? color : fallback;
}

function normalizeText(current: Partial<TextLayout> | undefined, fallback: TextLayout): TextLayout {
  const textAlign =
    current?.textAlign === "left" || current?.textAlign === "right" || current?.textAlign === "center"
      ? current.textAlign
      : fallback.textAlign;

  return {
    ...fallback,
    ...current,
    x: clamp(Number(current?.x ?? fallback.x), 0, 0.95),
    y: clamp(Number(current?.y ?? fallback.y), 0, 0.95),
    fontSize: clamp(Math.round(Number(current?.fontSize ?? fallback.fontSize)), 10, 96),
    fontWeight: clamp(Math.round(Number(current?.fontWeight ?? fallback.fontWeight)), 300, 900),
    color: normalizeColor(current?.color, fallback.color),
    backgroundColor: normalizeColor(current?.backgroundColor, fallback.backgroundColor ?? "#334155"),
    showBackground: current?.showBackground ?? fallback.showBackground ?? true,
    textAlign,
    borderRadius: clamp(Number(current?.borderRadius ?? fallback.borderRadius ?? 10), 0, 48),
  };
}

function normalizeFamilyText(
  current: Partial<FamilyTextLayout> | undefined,
  fallback: FamilyTextLayout,
): FamilyTextLayout {
  return {
    ...normalizeText(current, fallback),
    width: clamp(Number(current?.width ?? fallback.width), 0.08, 0.9),
    height: clamp(Number(current?.height ?? fallback.height), 0.06, 0.5),
  };
}

function normalizeTemplate(input: TemplateConfig): TemplateConfig {
  const defaults = getDefaultTemplate();

  const requestedFrames = Array.isArray(input.frames) ? input.frames : [];
  const frames = requestedFrames
    .slice(0, MAX_FRAMES_PER_TEMPLATE)
    .map((frame, index) => {
      const fallbackId = `frame-${index + 1}`;
      const normalizedImage = typeof frame?.image === "string" ? frame.image.trim() : "";
      if (!normalizedImage || !isValidImageReference(normalizedImage)) {
        return null;
      }

      const createdAtCandidate =
        typeof frame?.createdAt === "string" ? new Date(frame.createdAt) : new Date();

      return {
        id: normalizeSafeString(frame?.id, fallbackId, 120),
        name: normalizeSafeString(frame?.name, `Frame ${index + 1}`, MAX_TEXT_LENGTH),
        image: normalizedImage,
        createdAt: Number.isNaN(createdAtCandidate.getTime())
          ? new Date().toISOString()
          : createdAtCandidate.toISOString(),
      };
    })
    .filter((frame): frame is NonNullable<typeof frame> => Boolean(frame));

  return {
    ...defaults,
    ...input,
    id: normalizeSafeString(input.id, defaults.id, 120),
    name: normalizeSafeString(input.name, defaults.name, MAX_TEXT_LENGTH),
    slug: normalizeSafeString(input.slug, defaults.slug, 120),
    createdBy: normalizeSafeString(input.createdBy, defaults.createdBy, 60),
    frames,
    unitText: normalizeText(input.unitText, defaults.unitText),
    counterText: normalizeText(input.counterText, defaults.counterText),
    familyText: normalizeFamilyText(input.familyText, defaults.familyText),
    frameViewport: {
      width: Math.max(720, Number(input.frameViewport?.width ?? defaults.frameViewport.width)),
      height: Math.max(900, Number(input.frameViewport?.height ?? defaults.frameViewport.height)),
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [template, leaderboard, manualUnitCounts] = await Promise.all([
      getTemplate(FAMILY_FRAME_TEMPLATE_ID),
      getLeaderboard(FAMILY_FRAME_TEMPLATE_ID),
      getManualUnitCounts(FAMILY_FRAME_TEMPLATE_ID),
    ]);

    return NextResponse.json({
      template,
      leaderboard,
      manualUnitCounts: manualUnitCounts as ManualUnitCountMap,
    });
  } catch (error) {
    console.error("Failed to load admin template data", error);
    return NextResponse.json({ error: "Failed to load template data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as Partial<TemplateConfig>;
    if (!payload?.id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }
    if (!payload?.frames?.length) {
      return NextResponse.json({ error: "At least one frame is required" }, { status: 400 });
    }

    const normalized = normalizeTemplate(payload as TemplateConfig);
    if (!normalized.frames.length) {
      return NextResponse.json({ error: "No valid frame images found" }, { status: 400 });
    }

    const saved = await saveTemplate(normalized);
    return NextResponse.json({ template: saved });
  } catch (error) {
    console.error("Failed to save template", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
