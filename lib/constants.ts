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
  "'Poppins', sans-serif",
  "'Montserrat', sans-serif",
  "'Space Grotesk', sans-serif",
  "'Noto Sans Malayalam', sans-serif",
  "'Noto Serif Malayalam', serif",
  "'Baloo Chettan 2', sans-serif",
  "'Chilanka', cursive",
  "'Merriweather', serif",
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
      x: 0.53,
      y: 0.87,
      fontSize: 16,
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#0f766e",
      backgroundColor: "#0f766e",
      showBackground: false,
      textAlign: "center",
      borderRadius: 0,
    },
    counterText: {
      x: 0.86,
      y: 0.17,
      fontSize: 17,
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 700,
      color: "#ffffff",
      backgroundColor: "#7c4a03",
      showBackground: true,
      textAlign: "center",
      borderRadius: 12,
    },
    familyText: {
      x: 0.30,
      y: 0.73,
      width: 0.43,
      height: 0.06,
      fontSize: 16,
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#ffffff",
      backgroundColor: "#a5a913",
      showBackground: true,
      textAlign: "center",
      borderRadius: 6,
    },
    frameViewport: {
      width: 1080,
      height: 1350,
    },
  };
}
