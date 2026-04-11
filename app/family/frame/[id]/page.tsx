import { AppShell } from "@/components/AppShell";
import { UserFlow } from "@/components/UserFlow";

export default async function FamilyFrameTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unit?: string }>;
}) {
  const { id } = await params;
  const { unit } = await searchParams;

  return (
    <AppShell
      title="Family Frame"
      subtitle="Upload photo, confirm unit, and instantly share your Family Sahityolsav frame."
    >
      <UserFlow templateId={id} preselectedUnit={unit} />
    </AppShell>
  );
}
