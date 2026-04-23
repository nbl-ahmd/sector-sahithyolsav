"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { UNIT_LIST } from "@/lib/constants";
import { LeaderboardSnapshot, ManualUnitCountMap } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function zeroCounts(): ManualUnitCountMap {
  return Object.fromEntries(UNIT_LIST.map((unit) => [unit, 0])) as ManualUnitCountMap;
}

export function AdminManualCountsView() {
  const [manualUnitCounts, setManualUnitCounts] = useState<ManualUnitCountMap>(zeroCounts());
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/template", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Load failed");
        }

        const data = (await response.json()) as {
          leaderboard: LeaderboardSnapshot;
          manualUnitCounts: ManualUnitCountMap;
        };

        if (cancelled) {
          return;
        }

        setLeaderboard(data.leaderboard);
        setManualUnitCounts(data.manualUnitCounts);
      } catch {
        if (!cancelled) {
          toast.error("Could not load manual count data.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateManualUnitCount = (unit: (typeof UNIT_LIST)[number], nextValue: string) => {
    const numeric = Number(nextValue);
    const normalized = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;

    setManualUnitCounts((prev) => ({
      ...prev,
      [unit]: normalized,
    }));
  };

  const totalManual = useMemo(
    () => Object.values(manualUnitCounts).reduce((sum, value) => sum + value, 0),
    [manualUnitCounts],
  );

  const saveManualCounts = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/unit-counts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counts: manualUnitCounts,
        }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as {
        manualUnitCounts: ManualUnitCountMap;
        leaderboard: LeaderboardSnapshot;
        nextCounter: number;
      };

      setManualUnitCounts(data.manualUnitCounts);
      setLeaderboard(data.leaderboard);
      toast.success(`Manual counts updated. Next frame number: #${data.nextCounter}.`);
    } catch {
      toast.error("Failed to update manual unit counts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Manual Added</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{totalManual}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm sm:col-span-2">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total (Live + Manual)</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{leaderboard?.total ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Manual Unit Count Adjustments</CardTitle>
          <CardDescription>
            Add counts from offline or missed events so leaderboard and frame numbering stay correct.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {UNIT_LIST.map((unit) => (
              <div key={unit} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <Label className="mb-2 block text-sm font-semibold text-slate-700">{unit}</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={manualUnitCounts[unit] ?? 0}
                  onChange={(event) => updateManualUnitCount(unit, event.target.value)}
                  className="bg-white"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setManualUnitCounts(zeroCounts())}
              disabled={saving}
            >
              Reset
            </Button>
            <Button onClick={saveManualCounts} disabled={saving} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Updating..." : "Update Unit Counts"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
