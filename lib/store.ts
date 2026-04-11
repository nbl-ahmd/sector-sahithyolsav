import { hasDatabaseUrl } from "@/lib/db";
import * as fileStore from "@/lib/store-file";
import * as postgresStore from "@/lib/store-postgres";
import { FramedRecord, LeaderboardSnapshot, TemplateConfig, UnitName } from "@/lib/types";

const usePostgres = hasDatabaseUrl();

export async function getTemplate(templateId?: string): Promise<TemplateConfig> {
  return usePostgres ? postgresStore.getTemplate(templateId) : fileStore.getTemplate(templateId);
}

export async function saveTemplate(nextTemplate: TemplateConfig): Promise<TemplateConfig> {
  return usePostgres ? postgresStore.saveTemplate(nextTemplate) : fileStore.saveTemplate(nextTemplate);
}

export async function recordFraming(input: {
  templateId: string;
  unit: UnitName;
  frameId: string;
}): Promise<FramedRecord> {
  return usePostgres ? postgresStore.recordFraming(input) : fileStore.recordFraming(input);
}

export async function getLeaderboard(templateId?: string): Promise<LeaderboardSnapshot> {
  return usePostgres ? postgresStore.getLeaderboard(templateId) : fileStore.getLeaderboard(templateId);
}

export async function getCurrentGlobalCounter(): Promise<number> {
  return usePostgres
    ? postgresStore.getCurrentGlobalCounter()
    : fileStore.getCurrentGlobalCounter();
}

