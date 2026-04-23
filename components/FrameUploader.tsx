"use client";

import { useRef, useState } from "react";
import { FrameVariant } from "@/lib/types";
import { Loader2, UploadCloud } from "lucide-react";
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
    <button
      type="button"
      className="group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => inputRef.current?.click()}
      disabled={loading}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={onSelectFiles}
        className="sr-only"
      />
      <div className="mb-3 rounded-full bg-white p-3 text-primary ring-1 ring-slate-200 transition-all group-hover:ring-primary/30">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
      </div>
      <strong className="text-base font-semibold text-slate-900">
        {loading ? "Uploading frames..." : "Upload Frame Files"}
      </strong>
      <p className="mt-1 max-w-xl text-sm text-slate-600">
        PNG is recommended for transparent overlays. Click to add one or multiple files.
      </p>
    </button>
  );
}
