"use client";

import { useEffect, useState } from "react";

interface HomeCountdownProps {
  targetDate: string | null;
}

function getRemaining(targetDate: string | null): { days: number; hours: number } {
  if (!targetDate) {
    return { days: 0, hours: 0 };
  }

  const target = new Date(targetDate).getTime();
  if (!Number.isFinite(target)) {
    return { days: 0, hours: 0 };
  }

  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours };
}

export function HomeCountdown({ targetDate }: HomeCountdownProps) {
  const [, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = getRemaining(targetDate);

  return (
    <div className="flex items-center gap-2 sm:gap-3 text-amber-950 bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 max-w-fit shadow-sm">
      <div className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none">
          {remaining.days}
        </span>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-80 pt-1 leading-none">
          DAYS
        </span>
      </div>
      <div className="text-xl font-black opacity-30 leading-none mx-1">:</div>
      <div className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none">
          {remaining.hours}
        </span>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-80 pt-1 leading-none">
          HOURS
        </span>
      </div>
    </div>
  );
}
