import { TemplateConfig, UnitName, units } from "@/lib/types";

export const FAMILY_BASE_ROUTE = "/family";
export const FAMILY_FRAME_FEATURE_ID = "frame";

export const LEGACY_FAMILY_TEMPLATE_ID = "family-sahithyolsav";
export const FAMILY_FRAME_TEMPLATE_ID = "family-sahityolsav-frame";

export const FAMILY_FRAME_ROUTE_BASE = `${FAMILY_BASE_ROUTE}/${FAMILY_FRAME_FEATURE_ID}`;

export function getFamilyFrameRoute(templateId = FAMILY_FRAME_TEMPLATE_ID): string {
  return `${FAMILY_FRAME_ROUTE_BASE}/${templateId}`;
}

export const FONT_OPTIONS = [
  "'Merriweather', serif",
  "'Poppins', sans-serif",
  "'Manjari', sans-serif",
  "'Oswald', sans-serif",
];

export const UNIT_LIST: readonly UnitName[] = units;

export function resolveUnit(input: string | null | undefined): UnitName | undefined {
  if (!input) {
    return undefined;
  }

  const normalized = input.trim().toLowerCase().replace(/\s+/g, " ");
  return UNIT_LIST.find((unit) => unit.toLowerCase() === normalized);
}

export function getDefaultTemplate(): TemplateConfig {
  const now = new Date().toISOString();
  return {
    id: FAMILY_FRAME_TEMPLATE_ID,
    name: "Family Sahityolsav Frame",
    slug: FAMILY_FRAME_TEMPLATE_ID,
    createdBy: "admin",
    createdAt: now,
    updatedAt: now,
    frames: [],
    unitText: {
      x: 0.05,
      y: 0.06,
      fontSize: 28,
      fontFamily: "'Merriweather', serif",
      fontWeight: 700,
      color: "#ffffff",
    },
    counterText: {
      x: 0.75,
      y: 0.06,
      fontSize: 28,
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 700,
      color: "#ffffff",
    },
    frameViewport: {
      width: 1080,
      height: 1350,
    },
  };
}
