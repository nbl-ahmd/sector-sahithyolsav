export const units = [
  "Karassery",
  "Kakkad",
  "Sarkkarparamb",
  "Nellikkaparamb",
  "Velliyaparamb",
  "Karuthaparamb",
  "North Karassery",
  "Chonad",
] as const;

export type UnitName = (typeof units)[number];

export interface TextLayout {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
}

export interface FrameVariant {
  id: string;
  name: string;
  image: string;
  createdAt: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  frames: FrameVariant[];
  unitText: TextLayout;
  counterText: TextLayout;
  frameViewport: {
    width: number;
    height: number;
  };
}

export interface FramedRecord {
  id: string;
  templateId: string;
  unit: UnitName;
  counter: number;
  frameId: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  unit: UnitName;
  count: number;
}

export interface AppStore {
  templates: Record<string, TemplateConfig>;
  framedRecords: FramedRecord[];
  globalCounter: number;
}

export interface LeaderboardSnapshot {
  templateId: string;
  templateName: string;
  total: number;
  unitTotals: LeaderboardEntry[];
  recent: FramedRecord[];
}
