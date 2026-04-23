import { randomUUID } from "node:crypto";
import {
  FAMILY_FRAME_TEMPLATE_ID,
  LEGACY_FAMILY_TEMPLATE_ID,
  UNIT_LIST,
  getDefaultTemplate,
} from "@/lib/constants";
import { getSql } from "@/lib/db";
import {
  AppSettings,
  FamilyTextLayout,
  FramedRecord,
  LeaderboardSnapshot,
  ManualUnitCountMap,
  TemplateConfig,
  TextLayout,
  UnitName,
} from "@/lib/types";

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string | Date;
  updated_at: string | Date;
  unit_text: unknown;
  counter_text: unknown;
  family_text: unknown;
  frame_viewport: unknown;
};

type FrameRow = {
  id: string;
  name: string;
  image_url: string;
  created_at: string | Date;
};

let schemaReady: Promise<void> | null = null;

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

function normalizeTemplateId(templateId: string): string {
  return templateId === LEGACY_FAMILY_TEMPLATE_ID ? FAMILY_FRAME_TEMPLATE_ID : templateId;
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    if (typeof value === "string") {
      return JSON.parse(value) as T;
    }
    return value as T;
  } catch {
    return fallback;
  }
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

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return schemaReady;
  }

  schemaReady = (async () => {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        unit_text JSONB NOT NULL,
        counter_text JSONB NOT NULL,
        family_text JSONB NOT NULL,
        frame_viewport JSONB NOT NULL
      );
    `;

    await sql`
      ALTER TABLE templates
      ADD COLUMN IF NOT EXISTS family_text JSONB;
    `;

    await sql`
      UPDATE templates
      SET family_text = ${JSON.stringify(getDefaultTemplate().familyText)}::jsonb
      WHERE family_text IS NULL;
    `;

    await sql`
      ALTER TABLE templates
      ALTER COLUMN family_text SET NOT NULL;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS frames (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS framed_records (
        id UUID PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        unit TEXT NOT NULL,
        frame_id TEXT NOT NULL,
        family_name TEXT,
        counter INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
    `;

    await sql`
      ALTER TABLE framed_records
      ADD COLUMN IF NOT EXISTS family_name TEXT;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_counters (
        id SMALLINT PRIMARY KEY,
        global_counter INTEGER NOT NULL DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SMALLINT PRIMARY KEY,
        settings JSONB NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS unit_manual_counts (
        template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        unit TEXT NOT NULL,
        manual_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (template_id, unit)
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_framed_records_template_created
      ON framed_records(template_id, created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_framed_records_template_unit
      ON framed_records(template_id, unit);
    `;

    await sql`
      INSERT INTO app_counters (id, global_counter)
      VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO app_settings (id, settings)
      VALUES (1, ${JSON.stringify(defaultAppSettings())}::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `;

    const defaultTemplate = getDefaultTemplate();
    await sql`
      INSERT INTO templates (
        id,
        name,
        slug,
        created_by,
        created_at,
        updated_at,
        unit_text,
        counter_text,
        family_text,
        frame_viewport
      ) VALUES (
        ${defaultTemplate.id},
        ${defaultTemplate.name},
        ${defaultTemplate.slug},
        ${defaultTemplate.createdBy},
        ${defaultTemplate.createdAt},
        ${defaultTemplate.updatedAt},
        ${JSON.stringify(defaultTemplate.unitText)},
        ${JSON.stringify(defaultTemplate.counterText)},
        ${JSON.stringify(defaultTemplate.familyText)},
        ${JSON.stringify(defaultTemplate.frameViewport)}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    for (const unit of UNIT_LIST) {
      await sql`
        INSERT INTO unit_manual_counts (template_id, unit, manual_count)
        VALUES (${defaultTemplate.id}, ${unit}, 0)
        ON CONFLICT (template_id, unit) DO NOTHING;
      `;
    }
  })();

  return schemaReady;
}

async function getTemplateById(templateId: string): Promise<TemplateConfig | null> {
  const sql = getSql();
  const templateRows = (await sql`
    SELECT
      id,
      name,
      slug,
      created_by,
      created_at,
      updated_at,
      unit_text,
      counter_text,
      family_text,
      frame_viewport
    FROM templates
    WHERE id = ${templateId}
    LIMIT 1
  `) as TemplateRow[];

  const row = templateRows[0];
  if (!row) {
    return null;
  }

  const frameRows = (await sql`
    SELECT id, name, image_url, created_at
    FROM frames
    WHERE template_id = ${templateId}
    ORDER BY sort_order ASC, created_at ASC
  `) as FrameRow[];

  const defaults = getDefaultTemplate();
  const frameViewport = parseJsonField<{ width: number; height: number }>(
    row.frame_viewport,
    defaults.frameViewport,
  );

  const normalized = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    unitText: normalizeTextLayout(parseJsonField(row.unit_text, defaults.unitText), defaults.unitText),
    counterText: normalizeTextLayout(
      parseJsonField(row.counter_text, defaults.counterText),
      defaults.counterText,
    ),
    familyText: normalizeFamilyTextLayout(
      parseJsonField<Partial<FamilyTextLayout> | undefined>(row.family_text, undefined),
      defaults.familyText,
    ),
    frameViewport: {
      width: Math.max(720, Number(frameViewport.width ?? defaults.frameViewport.width)),
      height: Math.max(900, Number(frameViewport.height ?? defaults.frameViewport.height)),
    },
    frames: frameRows.map((frame) => ({
      id: frame.id,
      name: frame.name,
      image: frame.image_url,
      createdAt: toIso(frame.created_at),
    })),
  };

  return normalized;
}

export async function getTemplate(templateId = FAMILY_FRAME_TEMPLATE_ID): Promise<TemplateConfig> {
  await ensureSchema();

  const normalizedTemplateId = normalizeTemplateId(templateId);
  const fromRequested = await getTemplateById(normalizedTemplateId);
  if (fromRequested) {
    return fromRequested;
  }

  const fromDefault = await getTemplateById(FAMILY_FRAME_TEMPLATE_ID);
  return fromDefault ?? getDefaultTemplate();
}

export async function saveTemplate(nextTemplate: TemplateConfig): Promise<TemplateConfig> {
  await ensureSchema();
  const sql = getSql();

  const normalizedInput = normalizeTemplateShape(nextTemplate);
  const normalizedId = normalizeTemplateId(nextTemplate.id);
  const existingRows = (await sql`
    SELECT created_at
    FROM templates
    WHERE id = ${normalizedId}
    LIMIT 1
  `) as Array<{ created_at: string | Date }>;

  const createdAt = existingRows[0] ? toIso(existingRows[0].created_at) : nextTemplate.createdAt;
  const merged: TemplateConfig = {
    ...normalizedInput,
    id: normalizedId,
    slug: nextTemplate.slug || normalizedId,
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  await sql`
    INSERT INTO templates (
      id,
      name,
      slug,
      created_by,
      created_at,
      updated_at,
      unit_text,
      counter_text,
      family_text,
      frame_viewport
    ) VALUES (
      ${merged.id},
      ${merged.name},
      ${merged.slug},
      ${merged.createdBy},
      ${merged.createdAt},
      ${merged.updatedAt},
      ${JSON.stringify(merged.unitText)},
      ${JSON.stringify(merged.counterText)},
      ${JSON.stringify(merged.familyText)},
      ${JSON.stringify(merged.frameViewport)}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      updated_at = EXCLUDED.updated_at,
      unit_text = EXCLUDED.unit_text,
      counter_text = EXCLUDED.counter_text,
        family_text = EXCLUDED.family_text,
      frame_viewport = EXCLUDED.frame_viewport
  `;

  await sql`DELETE FROM frames WHERE template_id = ${merged.id}`;

  for (const [index, frame] of merged.frames.entries()) {
    await sql`
      INSERT INTO frames (id, template_id, name, image_url, created_at, sort_order)
      VALUES (
        ${frame.id},
        ${merged.id},
        ${frame.name},
        ${frame.image},
        ${frame.createdAt},
        ${index}
      )
      ON CONFLICT (id) DO UPDATE
      SET
        template_id = EXCLUDED.template_id,
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        created_at = EXCLUDED.created_at,
        sort_order = EXCLUDED.sort_order
    `;
  }

  return merged;
}

export async function recordFraming(input: {
  templateId: string;
  unit: UnitName;
  frameId: string;
  familyName?: string;
}): Promise<FramedRecord> {
  await ensureSchema();
  const sql = getSql();

  if (!UNIT_LIST.includes(input.unit)) {
    throw new Error("Invalid unit");
  }

  const normalizedTemplateId = normalizeTemplateId(input.templateId);
  const frameRows = (await sql`
    SELECT id
    FROM frames
    WHERE id = ${input.frameId} AND template_id = ${normalizedTemplateId}
    LIMIT 1
  `) as Array<{ id: string }>;

  if (!frameRows[0]) {
    throw new Error("Invalid frame for template");
  }

  const counterRows = (await sql`
    UPDATE app_counters
    SET global_counter = global_counter + 1
    WHERE id = 1
    RETURNING global_counter
  `) as Array<{ global_counter: number }>;

  const nextCounter = Number(counterRows[0]?.global_counter ?? 1);

  const record: FramedRecord = {
    id: randomUUID(),
    templateId: normalizedTemplateId,
    unit: input.unit,
    frameId: input.frameId,
    familyName: input.familyName?.trim() ? input.familyName.trim() : undefined,
    counter: nextCounter,
    createdAt: new Date().toISOString(),
  };

  await sql`
    INSERT INTO framed_records (id, template_id, unit, frame_id, family_name, counter, created_at)
    VALUES (
      ${record.id},
      ${record.templateId},
      ${record.unit},
      ${record.frameId},
      ${record.familyName ?? null},
      ${record.counter},
      ${record.createdAt}
    )
  `;

  return record;
}

export async function getLeaderboard(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<LeaderboardSnapshot> {
  await ensureSchema();
  const sql = getSql();

  const template = await getTemplate(templateId);

  const totalsByUnit = (await sql`
    SELECT unit, COUNT(*)::int AS count
    FROM framed_records
    WHERE template_id = ${template.id}
    GROUP BY unit
  `) as Array<{ unit: string; count: number }>;

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM framed_records
    WHERE template_id = ${template.id}
  `) as Array<{ total: number }>;

  const manualRows = (await sql`
    SELECT unit, manual_count
    FROM unit_manual_counts
    WHERE template_id = ${template.id}
  `) as Array<{ unit: string; manual_count: number }>;

  const recentRows = (await sql`
    SELECT id, template_id, unit, frame_id, family_name, counter, created_at
    FROM framed_records
    WHERE template_id = ${template.id}
    ORDER BY created_at DESC
    LIMIT 15
  `) as Array<{
    id: string;
    template_id: string;
    unit: UnitName;
    frame_id: string;
    family_name: string | null;
    counter: number;
    created_at: string | Date;
  }>;

  const byUnit = new Map(
    totalsByUnit.map((entry) => [entry.unit.toLowerCase(), Number(entry.count) || 0]),
  );

  const manualByUnit = new Map(
    manualRows.map((entry) => [entry.unit.toLowerCase(), Number(entry.manual_count) || 0]),
  );

  const liveUnitTotals = UNIT_LIST.map((unit) => ({
    unit,
    count: byUnit.get(unit.toLowerCase()) ?? 0,
  }));

  const manualUnitTotals = UNIT_LIST.map((unit) => ({
    unit,
    count: manualByUnit.get(unit.toLowerCase()) ?? 0,
  }));

  const unitTotals = UNIT_LIST.map((unit, index) => ({
    unit,
    count: liveUnitTotals[index].count + manualUnitTotals[index].count,
  })).sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit));

  const recent: FramedRecord[] = recentRows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    unit: UNIT_LIST.includes(row.unit) ? row.unit : UNIT_LIST[0],
    frameId: row.frame_id,
    familyName: row.family_name ?? undefined,
    counter: Number(row.counter),
    createdAt: toIso(row.created_at),
  }));

  return {
    templateId: template.id,
    templateName: template.name,
    total:
      Number(totalRows[0]?.total ?? 0) +
      manualUnitTotals.reduce((sum, entry) => sum + entry.count, 0),
    unitTotals,
    liveUnitTotals,
    manualUnitTotals,
    recent,
  };
}

export async function getTodayLeadingUnit(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<{ unit: string; count: number } | null> {
  await ensureSchema();
  const sql = getSql();

  const template = await getTemplate(templateId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = (await sql`
    SELECT unit, COUNT(*)::int AS count
    FROM framed_records
    WHERE template_id = ${template.id}
      AND created_at >= ${today.toISOString()}
    GROUP BY unit
    ORDER BY count DESC
    LIMIT 1
  `) as Array<{ unit: string; count: number }>;

  return rows.length > 0 ? rows[0] : null;
}

export async function getCurrentGlobalCounter(): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT global_counter
    FROM app_counters
    WHERE id = 1
    LIMIT 1
  `) as Array<{ global_counter: number }>;
  return Number(rows[0]?.global_counter ?? 0);
}

export async function getManualUnitCounts(
  templateId = FAMILY_FRAME_TEMPLATE_ID,
): Promise<ManualUnitCountMap> {
  await ensureSchema();
  const sql = getSql();
  const normalizedTemplateId = normalizeTemplateId(templateId);

  const rows = (await sql`
    SELECT unit, manual_count
    FROM unit_manual_counts
    WHERE template_id = ${normalizedTemplateId}
  `) as Array<{ unit: string; manual_count: number }>;

  const raw = Object.fromEntries(
    rows.map((row) => [row.unit, Number(row.manual_count) || 0]),
  );
  return normalizeManualCounts(raw);
}

export async function setManualUnitCounts(input: {
  templateId: string;
  counts: ManualUnitCountMap;
}): Promise<ManualUnitCountMap> {
  await ensureSchema();
  const sql = getSql();
  const normalizedTemplateId = normalizeTemplateId(input.templateId);
  const nextCounts = normalizeManualCounts(input.counts);

  for (const unit of UNIT_LIST) {
    await sql`
      INSERT INTO unit_manual_counts (template_id, unit, manual_count)
      VALUES (${normalizedTemplateId}, ${unit}, ${nextCounts[unit]})
      ON CONFLICT (template_id, unit) DO UPDATE
      SET manual_count = EXCLUDED.manual_count
    `;
  }

  const liveRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM framed_records
    WHERE template_id = ${normalizedTemplateId}
  `) as Array<{ total: number }>;

  const manualTotal = Object.values(nextCounts).reduce((sum, value) => sum + value, 0);
  const nextGlobalCounter = Number(liveRows[0]?.total ?? 0) + manualTotal;

  await sql`
    UPDATE app_counters
    SET global_counter = ${nextGlobalCounter}
    WHERE id = 1
  `;

  return nextCounts;
}

export async function getAppSettings(): Promise<AppSettings> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT settings
    FROM app_settings
    WHERE id = 1
    LIMIT 1
  `) as Array<{ settings: unknown }>;

  return normalizeAppSettings(parseJsonField(rows[0]?.settings, defaultAppSettings()));
}

export async function setAppSettings(input: AppSettings): Promise<AppSettings> {
  await ensureSchema();
  const sql = getSql();
  const normalized = normalizeAppSettings(input);

  await sql`
    INSERT INTO app_settings (id, settings)
    VALUES (1, ${JSON.stringify(normalized)}::jsonb)
    ON CONFLICT (id) DO UPDATE
    SET settings = EXCLUDED.settings
  `;

  return normalized;
}
