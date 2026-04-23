"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppSettings } from "@/lib/types";
import { toast } from "sonner";

function toDatetimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function AdminSettingsView() {
  const [sahithyolsavDate, setSahithyolsavDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Load failed");
        }

        const data = (await response.json()) as { settings: AppSettings };
        if (cancelled) {
          return;
        }

        setSahithyolsavDate(toDatetimeLocalValue(data.settings.sahithyolsavDate));
      } catch {
        if (!cancelled) {
          toast.error("Could not load app settings.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sahithyolsavDate: sahithyolsavDate ? new Date(sahithyolsavDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { settings: AppSettings };
      setSahithyolsavDate(toDatetimeLocalValue(data.settings.sahithyolsavDate));
      toast.success("Settings updated.");
    } catch {
      toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="h-5 w-5 text-primary" />
          Sahithyolsav Countdown Date
        </CardTitle>
        <CardDescription>
          Set the target date and time used by the homepage countdown.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sahithyolsav-date">Event date and time</Label>
            <Input
              id="sahithyolsav-date"
              type="datetime-local"
              value={sahithyolsavDate}
              onChange={(event) => setSahithyolsavDate(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Leave empty to hide countdown values.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
