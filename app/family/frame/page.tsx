import { AppShell } from "@/components/AppShell";
import { UserFlow } from "@/components/UserFlow";
import { FAMILY_FRAME_TEMPLATE_ID, resolveUnit } from "@/lib/constants";

export default async function FamilyFrameIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
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
      <UserFlow templateId={FAMILY_FRAME_TEMPLATE_ID} preselectedUnit={unit} />
    </AppShell>
  );
}
