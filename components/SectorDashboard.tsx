"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useMemo, useRef, useState } from "react";
import { downloadBlob, copyToClipboard } from "@/lib/client-utils";
import { LeaderboardSnapshot } from "@/lib/types";
import { StatCard } from "@/components/StatCard";

export function SectorDashboard() {
  const [data, setData] = useState<LeaderboardSnapshot | null>(null);
  const [status, setStatus] = useState("Loading leaderboard...");
  const [sharing, setSharing] = useState<"image" | "text" | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setStatus("Loading leaderboard...");
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("load failed");
      }

      const snapshot = (await response.json()) as LeaderboardSnapshot;
      setData(snapshot);
      setStatus("");
    } catch {
      setStatus("Could not fetch leaderboard right now.");
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
      setStatus("Leaderboard image ready.");
    } catch {
      setStatus("Unable to share leaderboard image right now.");
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
      setStatus("Leaderboard text shared.");
    } catch {
      setStatus("Could not share text right now.");
    } finally {
      setSharing(null);
    }
  };

  if (!data) {
    return <p className="status-text">{status}</p>;
  }

  const leading = data.unitTotals[0];

  return (
    <div className="stack-lg">
      <section className="panel-grid stats">
        <StatCard label="Sector Total" value={data.total} accent="#f6b73c" />
        <StatCard label="Units Reporting" value={data.unitTotals.filter((entry) => entry.count > 0).length} accent="#2ca58d" />
        <StatCard
          label="Current Leader"
          value={leading ? `${leading.unit} (${leading.count})` : "No entries yet"}
          accent="#118ab2"
        />
      </section>

      <section className="card" ref={shareRef}>
        <div className="card-head">
          <h2>Unit Leaderboard Standings</h2>
          <p>Track which unit has conducted the most Family Sahityolsav photo frames.</p>
        </div>

        <div className="table-wrap">
          <table className="rank-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Unit</th>
                <th>Photos Framed</th>
              </tr>
            </thead>
            <tbody>
              {data.unitTotals.map((entry, index) => {
                const width = data.total ? (entry.count / data.total) * 100 : 0;
                return (
                  <tr key={entry.unit}>
                    <td>#{index + 1}</td>
                    <td>{entry.unit}</td>
                    <td>
                      <div className="progress-cell">
                        <span>{entry.count}</span>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="action-row">
        <button className="btn primary" type="button" onClick={shareImage} disabled={sharing !== null}>
          {sharing === "image" ? "Preparing image..." : "Share Leaderboard as Image"}
        </button>
        <button className="btn" type="button" onClick={shareText} disabled={sharing !== null}>
          {sharing === "text" ? "Preparing text..." : "Share Leaderboard as Text"}
        </button>
        <button className="btn" type="button" onClick={refresh} disabled={sharing !== null}>
          Refresh
        </button>
      </section>

      {status ? <p className="status-text">{status}</p> : null}
    </div>
  );
}
