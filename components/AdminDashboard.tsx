"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FAMILY_FRAME_TEMPLATE_ID,
  FONT_OPTIONS,
  UNIT_LIST,
  getDefaultTemplate,
  getFamilyFrameRoute,
} from "@/lib/constants";
import { copyToClipboard, fileToDataUrl } from "@/lib/client-utils";
import { LeaderboardSnapshot, TemplateConfig, TextLayout } from "@/lib/types";
import { FrameCanvas } from "@/components/FrameCanvas";
import { FrameUploader } from "@/components/FrameUploader";
import { StatCard } from "@/components/StatCard";

interface AdminPayload {
  template: TemplateConfig;
  leaderboard: LeaderboardSnapshot;
}

type TextKey = "unit" | "counter";

const defaultPhotoTransform = { x: 0, y: 0, scale: 1 };

export function AdminDashboard() {
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");
  const [activeText, setActiveText] = useState<TextKey>("unit");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoTransform, setPhotoTransform] = useState(defaultPhotoTransform);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [origin, setOrigin] = useState("");
  const [previewWidth, setPreviewWidth] = useState(360);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatus("Loading dashboard...");
      try {
        const response = await fetch("/api/admin/template", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Load failed");
        }

        const data = (await response.json()) as AdminPayload;
        if (cancelled) {
          return;
        }

        setTemplate(data.template);
        setLeaderboard(data.leaderboard);
        setSelectedFrameId(data.template.frames[0]?.id ?? "");
        setStatus("");
      } catch {
        if (!cancelled) {
          setStatus("Could not load dashboard data.");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) {
      return;
    }

    const update = () => {
      setPreviewWidth(Math.max(300, Math.min(580, wrap.clientWidth)));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  const previewHeight = useMemo(() => {
    if (!template) {
      return Math.round(previewWidth * 1.2);
    }
    const ratio = template.frameViewport.height / template.frameViewport.width;
    return Math.round(previewWidth * ratio);
  }, [previewWidth, template]);

  const selectedFrame = useMemo(() => {
    if (!template) {
      return undefined;
    }
    return template.frames.find((frame) => frame.id === selectedFrameId) ?? template.frames[0];
  }, [selectedFrameId, template]);

  const currentText = useMemo<TextLayout>(() => {
    if (!template) {
      return getDefaultTemplate().unitText;
    }
    return activeText === "unit" ? template.unitText : template.counterText;
  }, [activeText, template]);

  const topUnit = leaderboard?.unitTotals[0];

  const setTextLayout = (key: TextKey, next: TextLayout) => {
    setTemplate((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        unitText: key === "unit" ? next : prev.unitText,
        counterText: key === "counter" ? next : prev.counterText,
      };
    });
  };

  const patchActiveText = (patch: Partial<TextLayout>) => {
    setTemplate((prev) => {
      if (!prev) {
        return prev;
      }

      const target = activeText === "unit" ? prev.unitText : prev.counterText;
      const next = { ...target, ...patch };

      return {
        ...prev,
        unitText: activeText === "unit" ? next : prev.unitText,
        counterText: activeText === "counter" ? next : prev.counterText,
      };
    });
  };

  const onSamplePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setPreviewPhoto(dataUrl);
    setPhotoTransform(defaultPhotoTransform);
  };

  const addFrames = (frames: TemplateConfig["frames"]) => {
    setTemplate((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        frames: [...prev.frames, ...frames],
      };
    });

    if (frames[0]) {
      setSelectedFrameId(frames[0].id);
    }
  };

  const removeFrame = (frameId: string) => {
    setTemplate((prev) => {
      if (!prev || prev.frames.length <= 1) {
        return prev;
      }

      const frames = prev.frames.filter((frame) => frame.id !== frameId);
      if (!frames.length) {
        return prev;
      }

      if (selectedFrameId === frameId) {
        setSelectedFrameId(frames[0].id);
      }

      return {
        ...prev,
        frames,
      };
    });
  };

  const moveFrame = (from: number, to: number) => {
    setTemplate((prev) => {
      if (!prev) {
        return prev;
      }
      if (to < 0 || to >= prev.frames.length) {
        return prev;
      }

      const nextFrames = [...prev.frames];
      const [item] = nextFrames.splice(from, 1);
      nextFrames.splice(to, 0, item);

      return {
        ...prev,
        frames: nextFrames,
      };
    });
  };

  const saveTemplate = async () => {
    if (!template) {
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { template: TemplateConfig };
      setTemplate(data.template);
      setStatus("Template saved successfully.");
    } catch {
      setStatus("Failed to save template. Please retry.");
    } finally {
      setSaving(false);
    }
  };

  const resetTextLayout = () => {
    const defaults = getDefaultTemplate();
    setTemplate((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        unitText: defaults.unitText,
        counterText: defaults.counterText,
      };
    });
  };

  const baseLink = origin
    ? `${origin}${getFamilyFrameRoute(template?.id ?? FAMILY_FRAME_TEMPLATE_ID)}`
    : "";

  const copyLink = async (link: string) => {
    if (!link) {
      return;
    }

    const ok = await copyToClipboard(link);
    setStatus(ok ? "Link copied to clipboard." : "Could not copy link on this browser.");
  };

  if (!template) {
    return <p className="status-text">{status || "Loading..."}</p>;
  }

  return (
    <div className="stack-lg">
      <section className="panel-grid stats">
        <StatCard label="Total Photos Framed" value={leaderboard?.total ?? 0} accent="#f6b73c" />
        <StatCard label="Units Active" value={leaderboard?.unitTotals.filter((item) => item.count > 0).length ?? 0} accent="#2ca58d" />
        <StatCard
          label="Leading Unit"
          value={topUnit ? `${topUnit.unit} (${topUnit.count})` : "No activity yet"}
          accent="#118ab2"
        />
      </section>

      <section className="panel-grid two-col">
        <article className="card">
          <div className="card-head">
            <h2>Template: Family Sahityolsav Frame</h2>
            <p>Upload the frame overlay used in the user flow.</p>
          </div>

          <FrameUploader onFramesAdd={addFrames} />

          <div className="frames-list">
            {template.frames.map((frame, index) => (
              <div key={frame.id} className={frame.id === selectedFrame?.id ? "frame-row active" : "frame-row"}>
                <button type="button" className="frame-name" onClick={() => setSelectedFrameId(frame.id)}>
                  {index + 1}. {frame.name}
                </button>
                <div className="frame-row-actions">
                  <button type="button" className="ghost" onClick={() => moveFrame(index, index - 1)}>
                    Up
                  </button>
                  <button type="button" className="ghost" onClick={() => moveFrame(index, index + 1)}>
                    Down
                  </button>
                  <button type="button" className="ghost danger" onClick={() => removeFrame(frame.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {template.frames.length === 0 ? (
            <p className="status-text error">
              No frame uploaded yet. Users can share only after one frame is uploaded and saved.
            </p>
          ) : null}

          <div className="action-row compact">
            <button type="button" className="btn primary" onClick={saveTemplate} disabled={saving}>
              {saving ? "Saving..." : "Save Template"}
            </button>
            <button type="button" className="btn" onClick={resetTextLayout}>
              Reset Text Layout
            </button>
          </div>
          {status ? <p className="status-text">{status}</p> : null}
        </article>

        <article className="card">
          <div className="card-head">
            <h2>Text Position & Style</h2>
            <p>Drag text directly on preview. Pinch on selected text to resize quickly.</p>
          </div>

          <div className="pill-row">
            <button
              type="button"
              className={activeText === "unit" ? "pill active" : "pill"}
              onClick={() => setActiveText("unit")}
            >
              Edit Unit Text
            </button>
            <button
              type="button"
              className={activeText === "counter" ? "pill active" : "pill"}
              onClick={() => setActiveText("counter")}
            >
              Edit Counter Text
            </button>
          </div>

          <div className="controls-grid">
            <label>
              Font Family
              <select
                className="input"
                value={currentText.fontFamily}
                onChange={(event) => patchActiveText({ fontFamily: event.target.value })}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font.replace(/["']/g, "")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Font Weight
              <select
                className="input"
                value={currentText.fontWeight}
                onChange={(event) => patchActiveText({ fontWeight: Number(event.target.value) })}
              >
                {[400, 500, 600, 700, 800].map((weight) => (
                  <option value={weight} key={weight}>
                    {weight}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Font Size: {currentText.fontSize}px
              <input
                type="range"
                min={12}
                max={96}
                value={currentText.fontSize}
                onChange={(event) => patchActiveText({ fontSize: Number(event.target.value) })}
              />
            </label>

            <label>
              Color
              <input
                type="color"
                className="color-input"
                value={currentText.color}
                onChange={(event) => patchActiveText({ color: event.target.value })}
              />
            </label>

            <label>
              X Position
              <input
                type="range"
                min={0}
                max={95}
                value={Math.round(currentText.x * 100)}
                onChange={(event) => patchActiveText({ x: Number(event.target.value) / 100 })}
              />
            </label>

            <label>
              Y Position
              <input
                type="range"
                min={0}
                max={95}
                value={Math.round(currentText.y * 100)}
                onChange={(event) => patchActiveText({ y: Number(event.target.value) / 100 })}
              />
            </label>
          </div>

          <label className="uploader-inline muted">
            <input type="file" accept="image/*" onChange={onSamplePhoto} />
            <span>{previewPhoto ? "Replace sample photo" : "Upload sample photo for alignment"}</span>
          </label>

          <div ref={previewWrapRef}>
            <FrameCanvas
              frameImage={selectedFrame?.image}
              photo={previewPhoto}
              width={previewWidth}
              height={previewHeight}
              unitLabel="Karassery"
              counterLabel="#128"
              unitText={template.unitText}
              counterText={template.counterText}
              photoTransform={photoTransform}
              onPhotoTransformChange={setPhotoTransform}
              editableText
              activeText={activeText}
              onActiveTextChange={setActiveText}
              onUnitTextChange={(next) => setTextLayout("unit", next)}
              onCounterTextChange={(next) => setTextLayout("counter", next)}
            />
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Unit Links</h2>
          <p>Send these unit-specific links for the simple user flow: open link, upload photo, share.</p>
        </div>

        <div className="link-grid">
          {UNIT_LIST.map((unit) => {
            const link = `${baseLink}?unit=${encodeURIComponent(unit)}`;
            return (
              <div className="link-row" key={unit}>
                <code>{unit}</code>
                <button type="button" className="btn" onClick={() => copyLink(link)}>
                  Copy {unit} User Link
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
