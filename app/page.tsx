import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UNIT_LIST, getFamilyFrameRoute } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Image as ImageIcon, Users, Crown, Flame } from "lucide-react";

import { HomeCountdown } from "@/components/HomeCountdown";
import { getAppSettings, getLeaderboard, getTodayLeadingUnit } from "@/lib/store";
import { HeroSection } from "@/components/HeroSection";

export default async function HomePage() {
  const familyFrameLink = getFamilyFrameRoute();
  const [leaderboardData, appSettings, todayLeadingUnit] = await Promise.all([getLeaderboard(), getAppSettings(), getTodayLeadingUnit()]);
  const leadingUnit = leaderboardData.unitTotals[0];
  const unitCountMap = new Map(leaderboardData.unitTotals.map((entry) => [entry.unit, entry.count]));
  const sortedUnits = [...UNIT_LIST].sort((leftUnit, rightUnit) => {
    const leftCount = unitCountMap.get(leftUnit) ?? 0;
    const rightCount = unitCountMap.get(rightUnit) ?? 0;
    return rightCount - leftCount || leftUnit.localeCompare(rightUnit);
  });

  return (
    <AppShell>
      <HeroSection targetDate={appSettings.sahithyolsavDate} />

      <div className="mb-4 sm:mb-5 flex items-center justify-center">
        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 text-[11px] sm:text-xs font-bold tracking-wider uppercase rounded-full">
          Family Sahityolsav Status
        </Badge>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden relative">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[90px]">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-50 rounded-lg p-2 text-emerald-600 ring-1 ring-emerald-100 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Sector Total</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{leaderboardData.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden relative">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[90px]">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 rounded-lg p-2 text-blue-600 ring-1 ring-blue-100 flex items-center justify-center">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Leading Unit</p>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate" title={leadingUnit?.unit ?? "N/A"}>
                  {leadingUnit ? leadingUnit.unit : "N/A"}
                </h3>
              </div>
              {leadingUnit && (
                 <div className="bg-slate-100 px-2 py-1 rounded-md text-slate-700 text-sm font-bold border border-slate-200 shadow-sm">
                   {leadingUnit.count}
                 </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden relative">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[90px]">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 rounded-lg p-2 text-purple-600 ring-1 ring-purple-100 flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Today&apos;s Top Unit</p>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate" title={todayLeadingUnit?.unit ?? "N/A"}>
                  {todayLeadingUnit ? todayLeadingUnit.unit : "N/A"}
                </h3>
              </div>
              {todayLeadingUnit && (
                 <div className="bg-purple-100 px-2 py-1 rounded-md text-purple-700 text-sm font-bold border border-purple-200 shadow-sm">
                   +{todayLeadingUnit.count}
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 sm:mb-5 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-10 sm:mb-12">
        <Link href="/family" className="block focus:outline-none">
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden group hover:border-blue-200/60 cursor-pointer h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 gap-4">
              <div className="text-blue-600 bg-blue-50 p-2.5 rounded-lg ring-1 ring-blue-100 shadow-sm group-hover:scale-105 group-hover:bg-blue-100 group-hover:ring-blue-200 transition-all">
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-blue-700 transition-colors">Family Frame</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Frame and share family sahithyolsav images.</p>
              </div>
              <div className="hidden sm:flex text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/sector" className="block focus:outline-none">
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden group hover:border-indigo-200/60 cursor-pointer h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 gap-4">
              <div className="text-indigo-600 bg-indigo-50 p-2.5 rounded-lg ring-1 ring-indigo-100 shadow-sm group-hover:scale-105 group-hover:bg-indigo-100 group-hover:ring-indigo-200 transition-all">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-indigo-700 transition-colors">Leaderboard & Stats</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Monitor individual unit standings and overall sector performance.</p>
              </div>
              <div className="hidden sm:flex text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">Units</h2>
      </div>

      <Card className="border border-slate-200 shadow-md sm:shadow-lg rounded-2xl bg-white overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap min-w-[500px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-widest sticky top-0">
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Unit Name</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Quick Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedUnits.map((unit) => (
                <tr key={unit} className="hover:bg-slate-50/80 transition-all duration-200 group">
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-900 flex items-center gap-3 sm:gap-4 text-sm sm:text-base">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xs sm:text-sm font-extrabold text-indigo-600 ring-4 ring-white shadow-sm group-hover:scale-105 transition-transform">
                      {unit.substring(0, 2).toUpperCase()}
                    </div>
                    {unit}
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold border border-indigo-200/60 shadow-sm px-2.5 py-1">
                      {unitCountMap.get(unit) ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <Button variant="ghost" size="sm" asChild className="text-primary font-semibold hover:text-primary hover:bg-primary/5 rounded-full transition-all px-4 group-hover:shadow-sm ring-1 ring-transparent hover:ring-primary/20">
                      <Link href={`${familyFrameLink}?unit=${encodeURIComponent(unit)}`}>
                        Frame Image
                        <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
