"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useMemo, useRef, useState } from "react";
import { downloadBlob, copyToClipboard } from "@/lib/client-utils";
import { LeaderboardSnapshot } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Share2, Copy, RefreshCcw, Image as ImageIcon, MapPin, Users, Activity } from "lucide-react";
import { toast } from "sonner";

export function SectorDashboard() {
  const [data, setData] = useState<LeaderboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharing, setSharing] = useState<"image" | "text" | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("load failed");
      }

      const snapshot = (await response.json()) as LeaderboardSnapshot;
      setData(snapshot);
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
    if (!shareRef.current || !data) {
      return;
    }

    setSharing("image");
    try {
      const canvas = await html2canvas(shareRef.current, {
        useCORS: true,
        backgroundColor: "#0a2d31",
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

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
           <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
             <div className="flex items-center justify-between mb-4">
                <p className="text-primary-foreground/80 font-medium text-sm w-full uppercase tracking-wider">Sector Total</p>
                <MapPin className="w-5 h-5 text-primary-foreground/50" />
             </div>
             <div>
                <div className="text-5xl font-black tracking-tight">{data.total}</div>
                <p className="mt-2 text-sm text-primary-foreground/90">Total unique frames generated</p>
             </div>
           </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
           <CardContent className="p-6 flex flex-col justify-between h-full">
             <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Units Reporting</p>
                <Users className="w-5 h-5 text-slate-400" />
             </div>
             <div>
                <div className="text-4xl font-bold text-slate-900">{activeUnits} <span className="text-2xl text-slate-400 font-medium">/ {data.unitTotals.length}</span></div>
                <p className="mt-2 text-sm text-slate-500">Active participating units</p>
             </div>
           </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
           <CardContent className="p-6 flex flex-col justify-between h-full">
             <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Current Leader</p>
                <Trophy className="w-5 h-5 text-amber-500" />
             </div>
             <div>
                <div className="text-2xl font-bold text-slate-900 truncate" title={leading?.unit ?? "N/A"}>
                    {leading ? leading.unit : "N/A"}
                </div>
                {leading && <p className="mt-2 text-sm text-slate-500 font-medium">{leading.count} frames contributed</p>}
             </div>
           </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden h-full" ref={shareRef}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
              <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 font-bold mb-1">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Standings
                  </CardTitle>
                  <CardDescription>
                    Real-time ranking of area units by participation.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center">Rank</th>
                    <th className="px-6 py-4">Unit Name</th>
                    <th className="px-6 py-4 w-24 text-right">Frames</th>
                    <th className="px-6 py-4 w-1/3 min-w-[150px]">Activity Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.unitTotals.map((entry, index) => {
                    const progress = (entry.count / maxCount) * 100;
                    return (
                      <tr key={entry.unit} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-amber-900/10 text-amber-900' : 'bg-slate-100 text-slate-500 font-medium'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{entry.unit}</td>
                        <td className="px-6 py-4 font-bold text-primary text-right">{entry.count}</td>
                        <td className="px-6 py-4">
                          <Progress value={progress || 0} className="h-2 w-full bg-slate-100" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
               <CardTitle className="text-sm font-semibold flex items-center gap-2">
                 <Share2 className="w-4 h-4 text-slate-500" />
                 Share & Export
               </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
               <Button
                 variant="default"
                 className="w-full justify-start gap-2"
                 onClick={shareImage}
                 disabled={sharing !== null}
               >
                 <ImageIcon className="w-4 h-4" />
                 {sharing === "image" ? "Generating..." : "Share as Image"}
               </Button>
               <Button
                 variant="outline"
                 className="w-full justify-start gap-2"
                 onClick={shareText}
                 disabled={sharing !== null}
               >
                 <Copy className="w-4 h-4" />
                 {sharing === "text" ? "Processing..." : "Copy as Text"}
               </Button>
            </CardContent>
          </Card>

          <Button
            variant="secondary"
            className="w-full gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            onClick={refresh}
            disabled={isLoading || sharing !== null}
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
