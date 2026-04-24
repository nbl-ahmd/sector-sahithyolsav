import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UNIT_LIST, getFamilyFrameRoute } from "@/lib/constants";
import { getLeaderboard } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Link as LinkIcon, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function FamilySectionPage() {
  const leaderboard = await getLeaderboard();
  const maxCount = Math.max(...leaderboard.unitTotals.map(u => u.count), 1);

  return (
    <AppShell
      title="Family Section"
      subtitle="Manage unit-specific links and track framing metrics for your sector."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Unit Links */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Unit Framing Links
              </CardTitle>
              <CardDescription>
                Choose a unit below to open the direct user upload-share screen. Distribute these links to unit members.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {UNIT_LIST.map((unit) => {
                  const stat = leaderboard.unitTotals.find((u) => u.unit === unit);
                  const count = stat?.count || 0;
                  
                  return (
                  <Link
                    key={unit}
                    href={`${getFamilyFrameRoute()}?unit=${encodeURIComponent(unit)}`}
                    className="group"
                  >
                    <div className="flex flex-col p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all h-full">
                      <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors mb-2">{unit}</span>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">
                          {count} framed
                        </span>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <LinkIcon className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )})}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden sticky top-24">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>Current standings based on the total number of photos framed.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {leaderboard.unitTotals.slice(0, 8).map((unitStat, i) => {
                  const progress = (unitStat.count / maxCount) * 100;
                  return (
                  <div key={unitStat.unit} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-amber-900/10 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-900 truncate text-sm">{unitStat.unit}</span>
                        <span className="font-bold text-slate-700 text-sm">{unitStat.count}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </div>
                )})}
              </div>
            </CardContent>
            {leaderboard.total > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100/50 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Framed: <span className="text-primary">{leaderboard.total}</span>
                </p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </AppShell>
  );
}
