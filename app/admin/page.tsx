import { AdminShell } from "@/components/AdminShell";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Manage the family frame template, styling, unit links, and activity insights."
    >
      <AdminDashboard />
    </AdminShell>
  );
}
