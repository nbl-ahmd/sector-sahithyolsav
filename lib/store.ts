import { hasDatabaseUrl } from "@/lib/db";
import * as fileStore from "@/lib/store-file";
import * as postgresStore from "@/lib/store-postgres";
import {
  AppSettings,
  FramedRecord,
  LeaderboardSnapshot,
  ManualUnitCountMap,
  TemplateConfig,
  UnitName,
} from "@/lib/types";

function shouldUsePostgres(): boolean {
  return hasDatabaseUrl();
}

export async function getTemplate(templateId?: string): Promise<TemplateConfig> {
  return shouldUsePostgres() ? postgresStore.getTemplate(templateId) : fileStore.getTemplate(templateId);
}

export async function saveTemplate(nextTemplate: TemplateConfig): Promise<TemplateConfig> {
  return shouldUsePostgres() ? postgresStore.saveTemplate(nextTemplate) : fileStore.saveTemplate(nextTemplate);
}

export async function recordFraming(input: {
  templateId: string;
  unit: UnitName;
  frameId: string;
  familyName?: string;
}): Promise<FramedRecord> {
  return shouldUsePostgres() ? postgresStore.recordFraming(input) : fileStore.recordFraming(input);
}

export async function getLeaderboard(templateId?: string): Promise<LeaderboardSnapshot> {
  return shouldUsePostgres() ? postgresStore.getLeaderboard(templateId) : fileStore.getLeaderboard(templateId);
}

export async function getCurrentGlobalCounter(): Promise<number> {
  return shouldUsePostgres()
    ? postgresStore.getCurrentGlobalCounter()
    : fileStore.getCurrentGlobalCounter();
}

export async function getManualUnitCounts(
  templateId?: string,
): Promise<ManualUnitCountMap> {
  return shouldUsePostgres()
    ? postgresStore.getManualUnitCounts(templateId)
    : fileStore.getManualUnitCounts(templateId);
}

export async function setManualUnitCounts(input: {
  templateId: string;
  counts: ManualUnitCountMap;
}): Promise<ManualUnitCountMap> {
  return shouldUsePostgres()
    ? postgresStore.setManualUnitCounts(input)
    : fileStore.setManualUnitCounts(input);
}

export async function getAppSettings(): Promise<AppSettings> {
  return shouldUsePostgres() ? postgresStore.getAppSettings() : fileStore.getAppSettings();
}

export async function setAppSettings(input: AppSettings): Promise<AppSettings> {
  return shouldUsePostgres() ? postgresStore.setAppSettings(input) : fileStore.setAppSettings(input);
}
