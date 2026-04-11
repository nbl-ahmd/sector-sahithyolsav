import { AppShell } from "@/components/AppShell";
import { SectorDashboard } from "@/components/SectorDashboard";

export default function SectorPage() {
  return (
    <AppShell
      title="Sector Leaderboard"
      subtitle="Live standings for all units and total Family Sahityolsav framed photos."
    >
      <SectorDashboard />
    </AppShell>
  );
}
