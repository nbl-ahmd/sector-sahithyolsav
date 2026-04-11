"use client";

import { useRef, useState } from "react";
import { FrameVariant } from "@/lib/types";
import { toast } from "sonner";

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

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/admin/blob", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = (await response.json()) as { frames?: FrameVariant[] };
      const frames = data.frames ?? [];
      if (!frames.length) {
        throw new Error("No frames returned");
      }

      onFramesAdd(frames);
      toast.success(`${frames.length} frame(s) uploaded.`);
    } catch {
      toast.error("Could not upload frames. Check Blob configuration.");
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
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
