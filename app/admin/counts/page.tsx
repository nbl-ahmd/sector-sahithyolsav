import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminManualCountsView } from "@/components/AdminManualCountsView";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminCountsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!isValidAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      title="Manual Count Adjustment"
      subtitle="Manage per-unit manual counts as a separate workflow from frame template editing."
    >
      <AdminManualCountsView />
    </AdminShell>
  );
}
