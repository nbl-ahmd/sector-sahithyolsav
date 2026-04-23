import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminSettingsView } from "@/components/AdminSettingsView";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!isValidAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      title="App Settings"
      subtitle="Configure global controls used across the public-facing pages."
    >
      <AdminSettingsView />
    </AdminShell>
  );
}
