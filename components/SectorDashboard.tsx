"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useMemo, useRef, useState } from "react";
import { downloadBlob, copyToClipboard } from "@/lib/client-utils";
import { LeaderboardSnapshot } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, Crown, Copy, RefreshCcw, Image as ImageIcon, MapPin, Users, Activity } from "lucide-react";
import { toast } from "sonner";

export function SectorDashboard() {
  const [data, setData] = useState<LeaderboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharing, setSharing] = useState<"image" | "text" | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const exportPosterRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("load failed");
      }

      const snapshot = (await response.json()) as LeaderboardSnapshot;
      setData(snapshot);
      setLastUpdatedAt(new Date().toISOString());
    } catch {
      toast.error("Could not fetch leaderboard right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const textSummary = useMemo(() => {
    if (!data) {
      return "";
    }

    const lines = [
      `Sector Sahityolsav Leaderboard`,
      `Total Photos Framed: ${data.total}`,
      ...data.unitTotals.map((entry, index) => `${index + 1}. ${entry.unit} - ${entry.count}`),
    ];

    return lines.join("\n");
  }, [data]);

  const shareImage = async () => {
    if (!exportPosterRef.current || !data) {
      return;
    }

    setSharing("image");
    try {
      const canvas = await html2canvas(exportPosterRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/png", 1);
      });

      if (!blob) {
        throw new Error("capture failed");
      }

      const file = new File([blob], "sector-sahityolsav-leaderboard.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Sector Sahityolsav Leaderboard",
          text: `Live standings by unit`,
        });
      } else {
        downloadBlob(blob, "sector-sahityolsav-leaderboard.png");
      }
      toast.success("Leaderboard image generated and shared.");
    } catch {
      toast.error("Unable to share leaderboard image right now.");
    } finally {
      setSharing(null);
    }
  };

  const shareText = async () => {
    if (!textSummary) {
      return;
    }

    setSharing("text");
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sector Sahityolsav Leaderboard",
          text: textSummary,
        });
      } else {
        await copyToClipboard(textSummary);
      }
      toast.success("Leaderboard text copied/shared.");
    } catch {
      toast.error("Could not share text right now.");
    } finally {
      setSharing(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-slate-50/50">
        <div className="flex flex-col items-center gap-2 text-slate-500">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
             <p className="font-medium animate-pulse">Loading Sector Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const leading = data.unitTotals[0];
  const activeUnits = data.unitTotals.filter((entry) => entry.count > 0).length;
  const maxCount = Math.max(...data.unitTotals.map(u => u.count), 1);
  const exportRows = data.unitTotals.slice(0, 10);
  const updatedAtLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <div className="space-y-6 sm:space-y-10 mb-12">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-primary/10 shadow-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground overflow-hidden relative group rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="absolute right-0 top-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-bl-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex items-center justify-between mb-4">
               <p className="text-primary-foreground/80 font-bold text-xs sm:text-sm w-full uppercase tracking-widest drop-shadow-sm">Sector Total</p>
               <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <div>
               <div className="text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-md">{data.total}</div>
               <p className="mt-3 text-sm font-medium text-primary-foreground/90">Total unique frames generated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl group">
          <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
               <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-widest">Units Reporting</p>
               <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="relative z-10">
               <div className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900">{activeUnits} <span className="text-2xl sm:text-3xl text-slate-400 font-bold opacity-50 block sm:inline">/ {data.unitTotals.length}</span></div>
               <p className="mt-3 text-sm font-medium text-slate-500">Active participating units</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl group sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
               <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2">Current Leader <Crown className="w-4 h-4 text-amber-500" /></p>
               <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform" />
            </div>
            <div className="relative z-10">
               <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 truncate" title={leading?.unit ?? "N/A"}>
                 {leading ? leading.unit : "N/A"}
               </div>
               {leading && <p className="mt-3 text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">{leading.count}</span> frames contributed</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Actions */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        <div className="flex-1 w-full order-2 lg:order-1">
          <Card className="border border-white/10 shadow-2xl overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_92%_0%,rgba(251,191,36,0.2),transparent_35%),linear-gradient(140deg,#071228_0%,#0e1f3f_45%,#111827_100%)]">
            <CardHeader className="border-b border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-3 font-extrabold mb-2 text-white tracking-tight">
                    <Activity className="w-6 h-6 text-cyan-300 p-1 bg-cyan-500/10 rounded-md" />
                    Sector Family Sahityotsav
                  </CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/60 font-semibold">
                    Live Standings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[520px]">
                <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] sm:text-xs font-black text-white/60 uppercase tracking-[0.25em] sticky top-0">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 w-16 sm:w-20 text-center">Rank</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Unit Name</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 w-24 text-right">Frames</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.unitTotals.map((entry, index) => (
                      <tr key={entry.unit} className="hover:bg-white/[0.03] transition-all duration-200 group">
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black text-base shadow-lg group-hover:scale-110 transition-transform ${
                            index === 0
                              ? "bg-[#F8D24F] text-[#5B4200]"
                              : index === 1
                              ? "bg-[#D9E0E8] text-[#344050]"
                              : index === 2
                              ? "bg-[#F5C38B] text-[#5A3506]"
                              : "bg-[#2E3B57] text-white/80"
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-white text-base sm:text-[34px] group-hover:text-cyan-100 transition-colors leading-none">{entry.unit}</td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 font-black text-cyan-300 text-3xl sm:text-4xl text-right tabular-nums tracking-tight">{entry.count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 sm:px-8 py-3 border-t border-white/10 bg-white/[0.02] text-xs sm:text-sm text-white/75 font-medium">
              Updated at {updatedAtLabel}
            </div>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-80 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 shrink-0">
          <Card className="border border-slate-200 shadow-lg bg-white rounded-2xl sticky top-24">
            <CardHeader className="pb-4 sm:pb-5 border-b border-slate-100 p-5 sm:p-6">
              <CardTitle className="text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                Share & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
              <Button
                variant="default"
                className="w-full justify-start gap-3 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all rounded-xl hover:-translate-y-0.5"
                onClick={shareImage}
                disabled={sharing !== null}
              >
                <ImageIcon className="w-5 h-5 flex-shrink-0" />
                {sharing === "image" ? "Generating Image..." : "Share as Image"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 sm:h-14 text-sm sm:text-base font-bold border-2 hover:bg-slate-50 transition-all rounded-xl group"
                onClick={shareText}
                disabled={sharing !== null}
              >
                <Copy className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-900 transition-colors" />
                {sharing === "text" ? "Processing..." : "Copy as Text"}
              </Button>

              <div className="pt-4 sm:pt-6 pb-2 border-t border-slate-100 w-full mt-2"></div>
              <Button
                variant="secondary"
                className="w-full gap-3 h-12 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-bold transition-all rounded-xl"
                onClick={refresh}
                disabled={isLoading || sharing !== null}
              >
                <RefreshCcw className={`w-4 h-4 flex-shrink-0 text-slate-500 ${isLoading ? 'animate-spin text-primary' : ''}`} />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed -left-[99999px] -top-[99999px] pointer-events-none" aria-hidden="true">
        <div
          ref={exportPosterRef}
          className="w-[1080px] p-12 rounded-[36px] overflow-hidden text-white"
          style={{
            background:
              "radial-gradient(900px 500px at 15% 0%, rgba(245,158,11,0.22), transparent 60%), radial-gradient(850px 520px at 100% 100%, rgba(14,165,233,0.25), transparent 62%), linear-gradient(140deg, #020617 0%, #0f172a 45%, #042f2e 100%)",
          }}
        >
          <div className="rounded-[28px] border border-white/20 bg-white/5 backdrop-blur-sm p-10">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-amber-300 text-lg font-semibold tracking-[0.18em] uppercase mb-3">Live Standings</p>
                <h2 className="text-6xl font-black leading-tight tracking-tight">Sector Family Sahityotsav</h2>
                <p className="mt-3 text-2xl text-slate-200">Updated at {updatedAtLabel}</p>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-right">
                <p className="text-sm uppercase tracking-widest text-amber-100">Total Frames</p>
                <p className="text-4xl font-black text-amber-200 tabular-nums">{data.total}</p>
              </div>
            </div>

            <div className="space-y-3">
              {exportRows.map((entry, index) => {
                const progress = Math.max(6, (entry.count / maxCount) * 100);
                return (
                  <div key={entry.unit} className="relative rounded-2xl border border-white/15 bg-white/5 px-5 py-4 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-300/30 to-sky-300/20" style={{ width: `${progress}%` }} />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-bold text-lg tabular-nums">
                          {index + 1}
                        </span>
                        <span className="text-2xl font-bold truncate">{entry.unit}</span>
                      </div>
                      <span className="text-3xl font-black tabular-nums text-amber-200">{entry.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-5 border-t border-white/15 flex items-center justify-between text-lg text-slate-200">
              <span>
                <span style={{ fontFamily: '"Cooper Black", "CooperBlack", "Bookman Old Style", serif' }}>SSF</span>{" "}
                Karassery Sector
              </span>
              <span>Updated at {updatedAtLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
