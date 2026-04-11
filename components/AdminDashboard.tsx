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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Trash2, Copy, Save, RotateCcw, Link2, Plus, Image as ImageIcon, Type, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

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
  const [origin, setOrigin] = useState("");
  const [previewWidth, setPreviewWidth] = useState(360);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
      } catch {
        if (!cancelled) {
          toast.error("Could not load dashboard data.");
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
      toast.success("Template saved successfully.");
    } catch {
      toast.error("Failed to save template. Please retry.");
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

  const copyLink = async (link: string, unit: string) => {
    if (!link) {
      return;
    }

    const ok = await copyToClipboard(link);
    if(ok) toast.success(`Link for ${unit} copied!`)
    else toast.error("Could not copy link on this browser.");
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-slate-50/50">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Photos Framed</p>
            <h3 className="text-3xl font-bold tracking-tight text-indigo-600">{leaderboard?.total ?? 0}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Units</p>
            <h3 className="text-3xl font-bold tracking-tight text-emerald-600">
              {leaderboard?.unitTotals.filter((item) => item.count > 0).length ?? 0}
            </h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Leading Unit</p>
            {topUnit ? (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight text-amber-600 truncate max-w-[200px]">{topUnit.unit}</h3>
                <span className="text-sm font-semibold text-slate-400">({topUnit.count})</span>
              </div>
            ) : (
              <h3 className="text-xl font-bold tracking-tight text-slate-400">No activity yet</h3>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Tools */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 p-1 mb-4 h-auto">
              <TabsTrigger value="template" className="py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Template & Frames
              </TabsTrigger>
              <TabsTrigger value="typography" className="py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md flex items-center gap-2">
                <Type className="w-4 h-4" /> Text Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-0 outline-none">
              <Card className="border-slate-200 shadow-sm bg-white origin-top animate-in zoom-in-95 duration-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
                  <CardTitle className="text-lg font-bold">Frames Editor</CardTitle>
                  <CardDescription>Upload the frame overlay used in the user facing workflow.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col gap-6">
                  
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 overflow-hidden transition-colors hover:bg-slate-50 hover:border-primary/50">
                    <FrameUploader onFramesAdd={addFrames} />
                  </div>

                  {template.frames.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <Label className="text-sm font-semibold text-slate-700">Uploaded Frames</Label>
                      <div className="flex flex-col gap-2">
                      {template.frames.map((frame, index) => (
                        <div 
                          key={frame.id} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${frame.id === selectedFrame?.id ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <button 
                            type="button" 
                            className="flex-1 text-left font-medium text-sm flex items-center gap-3" 
                            onClick={() => setSelectedFrameId(frame.id)}
                          >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${frame.id === selectedFrame?.id ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500'}`}>
                              {index + 1}
                            </div>
                            <span className={frame.id === selectedFrame?.id ? 'text-primary' : 'text-slate-700'}>{frame.name}</span>
                          </button>
                          
                          <div className="flex items-center gap-1 ml-4 bg-slate-50 rounded-lg p-1 border">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:text-slate-900" onClick={() => moveFrame(index, index - 1)} disabled={index === 0}>
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:text-slate-900" onClick={() => moveFrame(index, index + 1)} disabled={index === template.frames.length - 1}>
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFrame(frame.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-start gap-2">
                       No frame uploaded yet. Users can share only after one frame is uploaded and saved.
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 px-6 flex justify-between rounded-b-xl">
                  <Button variant="outline" onClick={resetTextLayout} size="sm" className="bg-white border-slate-200">
                    <RotateCcw className="w-4 h-4 mr-2 text-slate-500" />
                    Reset Typography
                  </Button>
                  <Button onClick={saveTemplate} disabled={saving} size="sm" className="shadow-sm gap-2">
                    {saving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Template"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="mt-0 outline-none">
              <Card className="border-slate-200 shadow-sm bg-white origin-top animate-in zoom-in-95 duration-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
                  <CardTitle className="text-lg font-bold">Typography</CardTitle>
                  <CardDescription>Drag text directly on preview or configure it precisely here.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  
                  <div className="flex bg-slate-100/80 p-1 rounded-lg mb-6 sticky top-0 z-10 w-max">
                    <button
                        type="button"
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeText === "unit" ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900"}`}
                        onClick={() => setActiveText("unit")}
                      >
                        Unit Text
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeText === "counter" ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900"}`}
                        onClick={() => setActiveText("counter")}
                      >
                        Counter Text
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Font Family</Label>
                      <Select 
                        value={currentText.fontFamily} 
                        onValueChange={(val) => patchActiveText({ fontFamily: val })}
                      >
                        <SelectTrigger className="w-full bg-slate-50/50">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font.replace(/["']/g, "")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Font Weight</Label>
                      <Select 
                        value={currentText.fontWeight.toString()} 
                        onValueChange={(val) => patchActiveText({ fontWeight: Number(val) })}
                      >
                        <SelectTrigger className="w-full bg-slate-50/50">
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          {[400, 500, 600, 700, 800].map((weight) => (
                            <SelectItem key={weight} value={weight.toString()}>
                              {weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</Label>
                        <span className="text-xs font-medium text-primary">{currentText.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={96}
                        className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        value={currentText.fontSize}
                        onChange={(e) => patchActiveText({ fontSize: Number(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Color Hex</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-10 w-10 p-1 bg-slate-50/50 border border-slate-200 rounded-md cursor-pointer"
                          value={currentText.color}
                          onChange={(e) => patchActiveText({ color: e.target.value })}
                        />
                        <Input 
                          value={currentText.color} 
                          onChange={(e) => patchActiveText({ color: e.target.value })} 
                          className="flex-1 font-mono text-sm bg-slate-50/50 uppercase" 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">X Position</Label>
                        <span className="text-xs font-medium text-slate-500">{Math.round(currentText.x * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={95}
                        className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        value={Math.round(currentText.x * 100)}
                        onChange={(e) => patchActiveText({ x: Number(e.target.value) / 100 })}
                      />
                    </div>

                    <div className="space-y-3">
                     <div className="flex justify-between">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Y Position</Label>
                        <span className="text-xs font-medium text-slate-500">{Math.round(currentText.y * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={95}
                        className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        value={Math.round(currentText.y * 100)}
                        onChange={(e) => patchActiveText({ y: Number(e.target.value) / 100 })}
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden mt-4">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" /> Rapid Links
              </CardTitle>
              <CardDescription>Distribute these pre-made URLs to your users.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
                {UNIT_LIST.map((unit) => {
                  const link = `${baseLink}?unit=${encodeURIComponent(unit)}`;
                  return (
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors" key={unit}>
                      <span className="font-semibold text-slate-700 text-sm truncate pr-4">{unit}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyLink(link, unit)} className="shrink-0 text-slate-500 hover:text-primary hover:bg-primary/10">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Preview Renderer */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="sticky top-24 w-full">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full ring-1 ring-black/[0.03]">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 shrink-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-md font-bold text-slate-800">Live Preview</CardTitle>
                  <CardDescription className="text-xs mt-1">Interactive WYSIWYG editor</CardDescription>
                </div>
                
                <div className="relative overflow-hidden group">
                  <input type="file" accept="image/*" onChange={onSamplePhoto} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
                  <Button variant="outline" size="sm" className="bg-white pointer-events-none gap-2 text-xs">
                    <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" /> {previewPhoto ? "Replace sample" : "Upload sample"}
                  </Button>
                </div>
              </CardHeader>

              <div className="bg-slate-100/50 flex-1 relative flex items-center justify-center p-4 min-h-[400px]">
                <div 
                  ref={previewWrapRef}
                  className="w-full max-w-[400px] flex items-center justify-center relative shadow-lg shadow-black/10 rounded-xl overflow-hidden ring-1 ring-black/5 bg-white"
                  style={{
                    aspectRatio: template ? `${template.frameViewport.width} / ${template.frameViewport.height}` : '1/1'
                  }}
                >
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
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
