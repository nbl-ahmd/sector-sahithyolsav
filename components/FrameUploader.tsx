"use client";

import { useRef, useState } from "react";
import { fileToDataUrl, slugify } from "@/lib/client-utils";
import { FrameVariant } from "@/lib/types";

interface FrameUploaderProps {
  onFramesAdd: (frames: FrameVariant[]) => void;
}

export function FrameUploader({ onFramesAdd }: FrameUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const onSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();
    const frames: FrameVariant[] = [];

    for (const file of files) {
      const image = await fileToDataUrl(file);
      frames.push({
        id: `${slugify(file.name)}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        image,
        createdAt: now,
      });
    }

    onFramesAdd(frames);
    setLoading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="uploader-card" onClick={() => inputRef.current?.click()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={onSelectFiles}
        style={{ display: "none" }}
      />
      <strong>{loading ? "Adding frames..." : "Upload Multiple Frames"}</strong>
      <p>PNG recommended for transparent overlays. Click to add one or many.</p>
    </div>
  );
}
