"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useMemo, useRef, useState } from "react";
import { FAMILY_FRAME_TEMPLATE_ID, resolveUnit } from "@/lib/constants";
import { downloadBlob, fileToDataUrl } from "@/lib/client-utils";
import { TemplateConfig } from "@/lib/types";
import { FrameCanvas } from "@/components/FrameCanvas";

interface UserFlowProps {
  templateId: string;
  preselectedUnit?: string | null;
}

const staticPhotoTransform = {
  x: 0,
  y: 0,
  scale: 1,
};

export function UserFlow({ templateId, preselectedUnit }: UserFlowProps) {
  const effectiveTemplateId = templateId || FAMILY_FRAME_TEMPLATE_ID;
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [nextCounter, setNextCounter] = useState(1);
  const [latestCounter, setLatestCounter] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(360);

  const lockedUnit = resolveUnit(preselectedUnit);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/template/${effectiveTemplateId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to fetch template");
        }
        const data = (await response.json()) as {
          template: TemplateConfig;
          nextCounter: number;
        };

        if (cancelled) {
          return;
        }

        setTemplate(data.template);
        setNextCounter(data.nextCounter || 1);
        setLatestCounter(null);
      } catch {
        if (!cancelled) {
          setError("Could not load the Family Sahityolsav frame template.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [effectiveTemplateId]);

  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) {
      return;
    }

    const updateSize = () => {
      setPreviewWidth(Math.max(280, Math.min(520, wrap.clientWidth)));
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  const selectedFrame = useMemo(() => template?.frames[0], [template]);

  const previewHeight = useMemo(() => {
    if (!template) {
      return Math.round(previewWidth * 1.2);
    }

    const ratio = template.frameViewport.height / template.frameViewport.width;
    return Math.round(previewWidth * ratio);
  }, [previewWidth, template]);

  const displayCounter = latestCounter ?? nextCounter;

  const onPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setPhoto(dataUrl);
    setError("");
  };

  const createFramedImage = async () => {
    if (!template || !selectedFrame || !photo || !lockedUnit || !exportRef.current) {
      setError("Use your unit link and upload a photo before sharing.");
      return;
    }

    setWorking(true);
    setError("");

    try {
      const reserveResponse = await fetch("/api/framing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          unit: lockedUnit,
          frameId: selectedFrame.id,
        }),
      });

      if (!reserveResponse.ok) {
        throw new Error("Could not reserve counter");
      }

      const reserveData = (await reserveResponse.json()) as {
        record: { counter: number };
      };

      const reservedCounter = reserveData.record.counter;
      setLatestCounter(reservedCounter);
      setNextCounter(reservedCounter + 1);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 1,
        width: template.frameViewport.width,
        height: template.frameViewport.height,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/png", 1);
      });

      if (!blob) {
        throw new Error("Unable to create image");
      }

      const filename = `${lockedUnit}-family-sahityolsav-frame-${reservedCounter}.png`;
      const file = new File([blob], filename, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Sector Sahityolsav - Family Frame",
          text: `${lockedUnit} • Family Sahityolsav Frame #${reservedCounter}`,
        });
      } else {
        downloadBlob(blob, filename);
      }
    } catch {
      setError("Could not generate the framed image. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <p className="status-text">Loading template...</p>;
  }

  if (!template) {
    return <p className="status-text error">Template unavailable right now.</p>;
  }

  if (!lockedUnit) {
    return (
      <p className="status-text error">
        This link is missing unit information. Please use the unit-specific link shared by the admin.
      </p>
    );
  }

  if (!selectedFrame) {
    return (
      <p className="status-text error">
        No frame is published yet. Please ask admin to upload and publish a frame first.
      </p>
    );
  }

  return (
    <div className="panel-grid two-col">
      <section className="card">
        <div className="card-head">
          <h2>Upload & Share</h2>
          <p>Unit: {lockedUnit}</p>
        </div>

        <label className="field-label">Photo</label>
        <label className="uploader-inline">
          <input type="file" accept="image/*" onChange={onPhotoUpload} />
          <span>{photo ? "Replace uploaded photo" : "Upload photo"}</span>
        </label>

        <div className="action-row">
          <button
            className="btn primary"
            type="button"
            onClick={createFramedImage}
            disabled={working || !photo}
          >
            {working ? "Preparing..." : "Share"}
          </button>
        </div>

        {error ? <p className="status-text error">{error}</p> : null}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Preview</h2>
          <p>Ready-to-share output</p>
        </div>
        <div ref={previewWrapRef}>
          <FrameCanvas
            frameImage={selectedFrame.image}
            photo={photo}
            width={previewWidth}
            height={previewHeight}
            unitLabel={lockedUnit}
            counterLabel={`#${displayCounter}`}
            unitText={template.unitText}
            counterText={template.counterText}
            photoTransform={staticPhotoTransform}
          />
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          left: -10000,
          top: -10000,
          width: template.frameViewport.width,
          height: template.frameViewport.height,
          pointerEvents: "none",
        }}
      >
        <div ref={exportRef}>
          <FrameCanvas
            frameImage={selectedFrame.image}
            photo={photo}
            width={template.frameViewport.width}
            height={template.frameViewport.height}
            unitLabel={lockedUnit}
            counterLabel={`#${displayCounter}`}
            unitText={template.unitText}
            counterText={template.counterText}
            photoTransform={staticPhotoTransform}
          />
        </div>
      </div>
    </div>
  );
}
