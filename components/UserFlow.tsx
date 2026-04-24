"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useMemo, useRef, useState } from "react";
import { FAMILY_FRAME_TEMPLATE_ID, resolveUnit } from "@/lib/constants";
import { downloadBlob, fileToDataUrl } from "@/lib/client-utils";
import { TemplateConfig } from "@/lib/types";
import { FrameCanvas } from "@/components/FrameCanvas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Share2, Download, Image as ImageIcon, MapPin, Eye } from "lucide-react";
import { toast } from "sonner";

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
  const [familyName, setFamilyName] = useState("");
  const [nextCounter, setNextCounter] = useState(1);
  const [latestCounter, setLatestCounter] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [photoTransform, setPhotoTransform] = useState(staticPhotoTransform);
  const [mobileStep, setMobileStep] = useState<"upload" | "preview">("upload");
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(360);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);

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
        setPhotoTransform(staticPhotoTransform);
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
    const query = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsMobileLayout(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

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

  useEffect(() => {
    if (!selectedFrame?.image) {
      setFrameSize(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedFrame.image;
    img.onload = () => {
      if (cancelled) {
        return;
      }
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setFrameSize({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        setFrameSize(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setFrameSize(null);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [selectedFrame?.image]);

  const exportViewport = useMemo(
    () =>
      frameSize ?? {
        width: template?.frameViewport.width ?? 1080,
        height: template?.frameViewport.height ?? 1350,
      },
    [frameSize, template?.frameViewport.height, template?.frameViewport.width],
  );

  const previewHeight = useMemo(() => {
    if (!exportViewport.width || !exportViewport.height) {
      return Math.round(previewWidth * 1.2);
    }

    const ratio = exportViewport.height / exportViewport.width;
    return Math.round(previewWidth * ratio);
  }, [previewWidth, exportViewport.height, exportViewport.width]);

  const displayCounter = latestCounter ?? nextCounter;
  const trimmedFamilyName = familyName.trim();

  const onPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setPhotoTransform(staticPhotoTransform);
      setMobileStep("preview");
      setError("");
      toast.success("Photo uploaded successfully.");
    } catch {
      toast.error("Failed to read the image file.");
    }
  };

  const createFramedImage = async (mode: "share" | "download" = "share") => {
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
          familyName: trimmedFamilyName || undefined,
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
        scale: exportViewport.width / previewWidth,
        width: previewWidth,
        height: previewHeight,
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
      const normalizedFamilyName = trimmedFamilyName || "Family";
      const shareCaption = `${normalizedFamilyName}\n${lockedUnit} unit family sahityolsav\n#${reservedCounter}`;

      if (mode === "share" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Sector Sahityolsav - Family Frame",
          text: shareCaption,
        });
      } else {
        downloadBlob(blob, filename);
      }
      toast.success(
        mode === "share"
          ? "Framed photo generated and ready to share!"
          : "Framed photo generated and downloaded.",
      );
    } catch {
      toast.error("Could not generate the framed image. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-slate-50/50">
        <div className="flex flex-col items-center gap-2 text-slate-500">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
             <p className="font-medium animate-pulse">Loading frame studio...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl text-red-600">
        <p className="font-bold">Template unavailable right now.</p>
      </div>
    );
  }

  if (!lockedUnit) {
    return (
      <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
        <p className="font-bold mb-2">Missing Unit Information</p>
        <p className="text-sm">Please use the unit-specific link shared by your admin.</p>
      </div>
    );
  }

  if (!selectedFrame) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
        <p className="font-bold mb-2">No Frame Available</p>
        <p className="text-sm">Please ask your admin to upload and publish a frame first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Your Photo
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-2">
               <MapPin className="w-4 h-4" /> Selected Unit: <strong className="text-slate-900">{lockedUnit}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isMobileLayout && (
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={mobileStep === "upload" ? "default" : "ghost"}
                  className="h-9 text-xs rounded-md"
                  onClick={() => setMobileStep("upload")}
                >
                  1. Upload
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mobileStep === "preview" ? "default" : "ghost"}
                  className="h-9 text-xs rounded-md"
                  onClick={() => setMobileStep("preview")}
                >
                  2. Preview & Share
                </Button>
              </div>
            )}
            
            <div className={`relative ${isMobileLayout && mobileStep !== "upload" ? "hidden" : ""}`}>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={onPhotoUpload} 
              />
              <div className={`transition-all duration-200 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 ${photo ? 'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-slate-100'}`}>
                <div className={`p-3 rounded-full ${photo ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                  {photo ? <ImageIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                   <p className="font-semibold text-slate-900">{photo ? "Click to change photo" : "Select a photo to frame"}</p>
                   <p className="text-xs text-slate-500 mt-1">JPEG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className={`space-y-2 ${isMobileLayout ? "hidden" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Family Name (Optional)</p>
              <Input
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value.slice(0, 120))}
                placeholder="e.g. Hidaya Family"
                className="h-11 bg-white"
              />
            </div>

            {photo && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-600">
                  Drag photo to move. Pinch to resize on mobile.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPhotoTransform(staticPhotoTransform)}
                >
                  Reset
                </Button>
              </div>
            )}

            {isMobileLayout && (
              <div className={`${mobileStep !== "preview" ? "hidden" : ""}`}>
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Family Name (Optional)
                  </p>
                  <Input
                    value={familyName}
                    onChange={(event) => setFamilyName(event.target.value.slice(0, 120))}
                    placeholder="e.g. Hidaya Family"
                    className="h-10 bg-white"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-2">
                  <div
                    ref={previewWrapRef}
                    className={`w-full max-w-[520px] mx-auto flex items-center justify-center transition-opacity duration-300 ${photo ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}
                  >
                    <div
                      ref={exportRef}
                      className="shadow-2xl rounded-sm overflow-hidden"
                      style={{ width: previewWidth, height: previewHeight }}
                    >
                      <FrameCanvas
                        frameImage={selectedFrame.image}
                        photo={photo}
                        width={previewWidth}
                        height={previewHeight}
                        unitLabel={`${lockedUnit} Unit`}
                        familyName={trimmedFamilyName}
                        counterLabel={`#${displayCounter}`}
                        unitText={template.unitText}
                        counterText={template.counterText}
                        familyText={template.familyText}
                        photoTransform={photoTransform}
                        onPhotoTransformChange={setPhotoTransform}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                isMobileLayout && mobileStep !== "preview" ? "hidden" : ""
              }`}
            >
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-md transition-all gap-2"
                onClick={() => createFramedImage("share")}
                disabled={working || !photo}
                variant={photo ? "default" : "secondary"}
              >
                <Share2 className="w-5 h-5" />
                {working ? "Generating..." : photo ? "Generate & Share" : "Upload photo"}
              </Button>
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold transition-all gap-2"
                onClick={() => createFramedImage("download")}
                disabled={working || !photo}
                variant="outline"
              >
                <Download className="w-5 h-5" />
                {working ? "Generating..." : "Download / Save"}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-none bg-blue-50/50 shadow-none">
          <CardContent className="p-4 text-sm text-blue-800 flex gap-3">
             <div className="mt-0.5"><Eye className="w-4 h-4 text-blue-500" /></div>
             <p>Your photo will be automatically placed behind the frame. A unique counter number will be generated when you share.</p>
          </CardContent>
        </Card>
      </div>

      {!isMobileLayout && (
      <div className="lg:col-span-7">
        <Card className="border-slate-200 shadow-sm overflow-hidden sticky top-8">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-500" />
              Live Preview
            </CardTitle>
            <CardDescription>
              {photo ? "This is how your final framed photo will look." : "Upload a photo to see the preview."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex justify-center bg-slate-100 min-h-[400px] relative">
            {!photo && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 z-10 pointer-events-none">
                 <div className="flex flex-col items-center gap-2 opacity-50">
                    <ImageIcon className="w-12 h-12" />
                    <p className="font-medium text-sm">Preview will appear here</p>
                 </div>
              </div>
            )}
            <div ref={previewWrapRef} className={`w-full max-w-[520px] mx-auto p-4 md:p-8 flex items-center justify-center transition-opacity duration-300 ${photo ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}>
              <div
                ref={exportRef}
                className="shadow-2xl rounded-sm overflow-hidden"
                style={{ width: previewWidth, height: previewHeight }}
              >
                <FrameCanvas
                  frameImage={selectedFrame.image}
                  photo={photo}
                  width={previewWidth}
                  height={previewHeight}
                  unitLabel={`${lockedUnit} Unit`}
                  familyName={trimmedFamilyName}
                  counterLabel={`#${displayCounter}`}
                  unitText={template.unitText}
                  counterText={template.counterText}
                  familyText={template.familyText}
                  photoTransform={photoTransform}
                  onPhotoTransformChange={setPhotoTransform}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
