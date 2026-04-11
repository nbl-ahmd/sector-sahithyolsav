import { AppShell } from "@/components/AppShell";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <AppShell
      title="Admin Dashboard"
      subtitle="Manage the family frame template, styling, unit links, and activity insights."
    >
      <AdminDashboard />
    </AppShell>
  );
}
