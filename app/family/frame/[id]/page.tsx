import { AppShell } from "@/components/AppShell";
import { UserFlow } from "@/components/UserFlow";
import { resolveUnit } from "@/lib/constants";

export default async function FamilyFrameTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unit?: string }>;
}) {
  const { id } = await params;
  const { unit } = await searchParams;
  const resolvedUnit = resolveUnit(unit);

  return (
    <AppShell
      title={resolvedUnit ? `${resolvedUnit} Family Frame` : "Family Frame"}
      subtitle={
        resolvedUnit
          ? `Unit link detected for ${resolvedUnit}. Upload photo and instantly share your Family Sahityolsav frame.`
          : "Upload photo, confirm unit, and instantly share your Family Sahityolsav frame."
      }
    >
      <UserFlow templateId={id} preselectedUnit={unit} />
    </AppShell>
  );
}
