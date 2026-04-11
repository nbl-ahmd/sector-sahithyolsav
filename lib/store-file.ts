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
  AppStore,
  FramedRecord,
  LeaderboardSnapshot,
  TemplateConfig,
  UnitName,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

let mutationQueue: Promise<unknown> = Promise.resolve();

function normalizeFamilyTemplate(template: TemplateConfig): TemplateConfig {
  const nextName =
    template.name === "Family Sahithyolsav" || template.name === "Family Sahityolsav"
      ? "Family Sahityolsav Frame"
      : template.name;
  const frames = (template.frames ?? []).filter(
    (frame) => !(frame.id === "default-frame" && frame.image === "/default-frame.svg"),
  );

  return {
    ...template,
    id: FAMILY_FRAME_TEMPLATE_ID,
    slug:
      template.slug === LEGACY_FAMILY_TEMPLATE_ID || template.slug === "family-sahityolsav"
        ? FAMILY_FRAME_TEMPLATE_ID
        : template.slug,
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

  return {
    templates,
    framedRecords,
    globalCounter: Number.isFinite(maybeStore.globalCounter) ? Number(maybeStore.globalCounter) : 0,
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
    const current = store.templates[nextTemplate.id];
    const createdAt = current?.createdAt ?? nextTemplate.createdAt;

    const merged: TemplateConfig = {
      ...nextTemplate,
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

  const unitTotals = UNIT_LIST.map((unit) => ({
    unit,
    count: relevant.filter((row) => row.unit === unit).length,
  })).sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit));

  return {
    templateId: template.id,
    templateName: template.name,
    total: relevant.length,
    unitTotals,
    recent: relevant.slice(0, 15),
  };
}

export async function getCurrentGlobalCounter(): Promise<number> {
  const store = await readStore();
  return store.globalCounter;
}
