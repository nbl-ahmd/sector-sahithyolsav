import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  FAMILY_FRAME_TEMPLATE_ID,
  LEGACY_FAMILY_TEMPLATE_ID,
  UNIT_LIST,
  getDefaultTemplate,
} from "@/lib/constants";
import {
  AppSettings,
  AppStore,
  FamilyTextLayout,
  FramedRecord,
  LeaderboardSnapshot,
  ManualUnitCountMap,
  TemplateConfig,
  TextLayout,
  UnitName,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

let mutationQueue: Promise<unknown> = Promise.resolve();

function defaultAppSettings(): AppSettings {
  return {
    sahithyolsavDate: null,
  };
}

function normalizeAppSettings(input: unknown): AppSettings {
  if (!input || typeof input !== "object") {
    return defaultAppSettings();
  }

  const settings = input as Partial<AppSettings>;
  const rawDate = typeof settings.sahithyolsavDate === "string" ? settings.sahithyolsavDate.trim() : "";
  if (!rawDate) {
    return defaultAppSettings();
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return defaultAppSettings();
  }

  return {
    sahithyolsavDate: parsed.toISOString(),
  };
}

function buildZeroManualCounts(): ManualUnitCountMap {
  return Object.fromEntries(UNIT_LIST.map((unit) => [unit, 0])) as ManualUnitCountMap;
}

function normalizeManualCounts(input: unknown): ManualUnitCountMap {
  const base = buildZeroManualCounts();
  if (!input || typeof input !== "object") {
    return base;
  }

  const rows = input as Record<string, unknown>;
  for (const unit of UNIT_LIST) {
    const value = rows[unit];
    const numeric = Number(value);
    base[unit] = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
  }

  return base;
}

function normalizeTextLayout(current: TextLayout, fallback: TextLayout): TextLayout {
  return {
    ...fallback,
    ...current,
    backgroundColor: current.backgroundColor ?? fallback.backgroundColor,
    showBackground: current.showBackground ?? fallback.showBackground,
    textAlign: current.textAlign ?? fallback.textAlign,
    borderRadius: current.borderRadius ?? fallback.borderRadius,
  };
}

function normalizeFamilyTextLayout(
  current: Partial<FamilyTextLayout> | undefined,
  fallback: FamilyTextLayout,
): FamilyTextLayout {
  return {
    ...fallback,
    ...current,
    backgroundColor: current?.backgroundColor ?? fallback.backgroundColor,
    showBackground: current?.showBackground ?? fallback.showBackground,
    textAlign: current?.textAlign ?? fallback.textAlign,
    borderRadius: current?.borderRadius ?? fallback.borderRadius,
  };
}

function normalizeTemplateShape(template: TemplateConfig): TemplateConfig {
  const defaults = getDefaultTemplate();
  return {
    ...template,
    unitText: normalizeTextLayout(template.unitText, defaults.unitText),
    counterText: normalizeTextLayout(template.counterText, defaults.counterText),
    familyText: normalizeFamilyTextLayout(template.familyText, defaults.familyText),
  };
}

function normalizeFamilyTemplate(template: TemplateConfig): TemplateConfig {
  const normalizedTemplate = normalizeTemplateShape(template);
  const nextName =
    normalizedTemplate.name === "Family Sahithyolsav" || normalizedTemplate.name === "Family Sahityolsav"
      ? "Family Sahityolsav Frame"
      : normalizedTemplate.name;
  const frames = (normalizedTemplate.frames ?? []).filter(
    (frame) => !(frame.id === "default-frame" && frame.image === "/default-frame.svg"),
  );

  return {
    ...normalizedTemplate,
    id: FAMILY_FRAME_TEMPLATE_ID,
    slug:
      normalizedTemplate.slug === LEGACY_FAMILY_TEMPLATE_ID || normalizedTemplate.slug === "family-sahityolsav"
        ? FAMILY_FRAME_TEMPLATE_ID
        : normalizedTemplate.slug,
    name: nextName,
    frames,
  };
}

function createInitialStore(): AppStore {
  const template = getDefaultTemplate();
  return {
    templates: {
      [template.id]: template,
    },
    framedRecords: [],
    globalCounter: 0,
    manualUnitCountsByTemplate: {
      [template.id]: buildZeroManualCounts(),
    },
    appSettings: defaultAppSettings(),
  };
}

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(createInitialStore(), null, 2), "utf8");
  }
}

function normalizeStore(maybeStore: Partial<AppStore> | null | undefined): AppStore {
  const fallback = createInitialStore();
  if (!maybeStore) {
    return fallback;
  }

  const rawTemplates =
    maybeStore.templates && Object.keys(maybeStore.templates).length > 0
      ? maybeStore.templates
      : fallback.templates;

  const templates = { ...rawTemplates };

  if (templates[LEGACY_FAMILY_TEMPLATE_ID] && !templates[FAMILY_FRAME_TEMPLATE_ID]) {
    templates[FAMILY_FRAME_TEMPLATE_ID] = normalizeFamilyTemplate(
      templates[LEGACY_FAMILY_TEMPLATE_ID],
    );
    delete templates[LEGACY_FAMILY_TEMPLATE_ID];
  } else if (templates[FAMILY_FRAME_TEMPLATE_ID]) {
    templates[FAMILY_FRAME_TEMPLATE_ID] = normalizeFamilyTemplate(
      templates[FAMILY_FRAME_TEMPLATE_ID],
    );
  }

  const framedRecords = Array.isArray(maybeStore.framedRecords)
    ? maybeStore.framedRecords.map((record) =>
        record.templateId === LEGACY_FAMILY_TEMPLATE_ID
          ? { ...record, templateId: FAMILY_FRAME_TEMPLATE_ID }
          : record,
      )
    : [];

  const rawManualCountsByTemplate =
    maybeStore.manualUnitCountsByTemplate &&
    typeof maybeStore.manualUnitCountsByTemplate === "object"
      ? (maybeStore.manualUnitCountsByTemplate as Record<string, unknown>)
      : {};

  const manualUnitCountsByTemplate = Object.fromEntries(
    Object.entries(rawManualCountsByTemplate).map(([templateId, counts]) => [
      templateId === LEGACY_FAMILY_TEMPLATE_ID ? FAMILY_FRAME_TEMPLATE_ID : templateId,
      normalizeManualCounts(counts),
    ]),
  ) as Record<string, ManualUnitCountMap>;

  if (!manualUnitCountsByTemplate[FAMILY_FRAME_TEMPLATE_ID]) {
    manualUnitCountsByTemplate[FAMILY_FRAME_TEMPLATE_ID] = buildZeroManualCounts();
  }

  return {
    templates,
    framedRecords,
    globalCounter: Number.isFinite(maybeStore.globalCounter) ? Number(maybeStore.globalCounter) : 0,
    manualUnitCountsByTemplate,
    appSettings: normalizeAppSettings(maybeStore.appSettings),
  };
}

async function readStore(): Promise<AppStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<AppStore>;
  return normalizeStore(parsed);
}

async function writeStore(store: AppStore): Promise<void> {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withStoreMutation<T>(mutator: (store: AppStore) => Promise<T> | T): Promise<T> {
  const run = mutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  mutationQueue = run.catch(() => undefined);
  return run;
}

export async function getTemplate(templateId = FAMILY_FRAME_TEMPLATE_ID): Promise<TemplateConfig> {
  const store = await readStore();
  const template =
    store.templates[templateId] ??
    (templateId === LEGACY_FAMILY_TEMPLATE_ID
      ? store.templates[FAMILY_FRAME_TEMPLATE_ID]
      : undefined);
  if (template) {
    return template;
  }

  const defaultTemplate = getDefaultTemplate();
  return defaultTemplate;
}

export async function saveTemplate(nextTemplate: TemplateConfig): Promise<TemplateConfig> {
  return withStoreMutation(async (store) => {
    const normalizedInput = normalizeTemplateShape(nextTemplate);
    const current = store.templates[nextTemplate.id];
    const createdAt = current?.createdAt ?? normalizedInput.createdAt;

    const merged: TemplateConfig = {
      ...normalizedInput,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    store.templates[merged.id] = merged;
    return merged;
  });
}

export async function recordFraming(input: {
  templateId: string;
  unit: UnitName;
  frameId: string;
  familyName?: string;
}): Promise<FramedRecord> {
  return withStoreMutation(async (store) => {
    if (!UNIT_LIST.includes(input.unit)) {
      throw new Error("Invalid unit");
    }

    const normalizedTemplateId =
      input.templateId === LEGACY_FAMILY_TEMPLATE_ID ? FAMILY_FRAME_TEMPLATE_ID : input.templateId;

    store.globalCounter += 1;

    const record: FramedRecord = {
      id: randomUUID(),
      templateId: normalizedTemplateId,
      unit: input.unit,
      frameId: input.frameId,
      familyName: input.familyName?.trim() ? input.familyName.trim() : undefined,
      counter: store.globalCounter,
      createdAt: new Date().toISOString(),
    };

    store.framedRecords.unshift(record);
    if (store.framedRecords.length > 5000) {
      store.framedRecords = store.framedRecords.slice(0, 5000);
    }

    return record;
  });
}

export async function getLeaderboard(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<LeaderboardSnapshot> {
  const store = await readStore();

  const normalizedTemplateId =
    templateId === LEGACY_FAMILY_TEMPLATE_ID ? FAMILY_FRAME_TEMPLATE_ID : templateId;

  const template =
    store.templates[normalizedTemplateId] ??
    store.templates[FAMILY_FRAME_TEMPLATE_ID] ??
    store.templates[LEGACY_FAMILY_TEMPLATE_ID] ??
    getDefaultTemplate();

  const relevant = store.framedRecords.filter((row) => row.templateId === template.id);

  const manualCounts =
    store.manualUnitCountsByTemplate[template.id] ??
    store.manualUnitCountsByTemplate[normalizedTemplateId] ??
    buildZeroManualCounts();

  const liveByUnit = UNIT_LIST.map((unit) => ({
    unit,
    count: relevant.filter((row) => row.unit === unit).length,
  }));

  const manualByUnit = UNIT_LIST.map((unit) => ({
    unit,
    count: manualCounts[unit] ?? 0,
  }));

  const unitTotals = UNIT_LIST.map((unit, index) => ({
    unit,
    count: liveByUnit[index].count + manualByUnit[index].count,
  })).sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit));

  return {
    templateId: template.id,
    templateName: template.name,
    total: unitTotals.reduce((sum, row) => sum + row.count, 0),
    unitTotals,
    liveUnitTotals: liveByUnit,
    manualUnitTotals: manualByUnit,
    recent: relevant.slice(0, 15),
  };
}

export async function getTodayLeadingUnit(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<{ unit: string; count: number } | null> {
  const storeList = await readStore();
  const template = await getTemplate(templateId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const templateRecords = storeList.framedRecords.filter(
    (item) => item.templateId === template.id && item.createdAt >= todayStr,
  );

  const unitMap = new Map<string, number>();
  for (const record of templateRecords) {
    unitMap.set(record.unit, (unitMap.get(record.unit) || 0) + 1);
  }

  let leadingUnit: { unit: string; count: number } | null = null;
  for (const [unit, count] of unitMap.entries()) {
    if (!leadingUnit || count > leadingUnit.count) {
      leadingUnit = { unit, count };
    }
  }

  return leadingUnit;
}

export async function getCurrentGlobalCounter(): Promise<number> {
  const store = await readStore();
  return store.globalCounter;
}

export async function getManualUnitCounts(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<ManualUnitCountMap> {
  const store = await readStore();
  const normalizedTemplateId =
    templateId === LEGACY_FAMILY_TEMPLATE_ID ? FAMILY_FRAME_TEMPLATE_ID : templateId;
  return normalizeManualCounts(store.manualUnitCountsByTemplate[normalizedTemplateId]);
}

export async function setManualUnitCounts(input: {
  templateId: string;
  counts: ManualUnitCountMap;
}): Promise<ManualUnitCountMap> {
  return withStoreMutation(async (store) => {
    const normalizedTemplateId =
      input.templateId === LEGACY_FAMILY_TEMPLATE_ID
        ? FAMILY_FRAME_TEMPLATE_ID
        : input.templateId;

    const nextCounts = normalizeManualCounts(input.counts);
    store.manualUnitCountsByTemplate[normalizedTemplateId] = nextCounts;

    const liveCount = store.framedRecords.filter(
      (row) => row.templateId === normalizedTemplateId,
    ).length;
    const manualCount = Object.values(nextCounts).reduce((sum, value) => sum + value, 0);
    store.globalCounter = Math.max(0, liveCount + manualCount);

    return nextCounts;
  });
}

export async function getAppSettings(): Promise<AppSettings> {
  const store = await readStore();
  return normalizeAppSettings(store.appSettings);
}

export async function setAppSettings(input: AppSettings): Promise<AppSettings> {
  return withStoreMutation(async (store) => {
    const normalized = normalizeAppSettings(input);
    store.appSettings = normalized;
    return normalized;
  });
}
