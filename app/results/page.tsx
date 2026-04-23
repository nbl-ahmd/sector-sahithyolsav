import { AppShell } from "@/components/AppShell";
import { Copy, Download, Image as ImageIcon, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage() {
  return (
    <AppShell 
      title="Contest Results" 
      subtitle="Download official results posters"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-12 text-center group">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
          {/* Icon Composition */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-amber-100 blur-2xl rounded-full scale-150 animate-pulse opacity-50" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl ring-8 ring-white group-hover:scale-105 transition-transform duration-500">
              <Trophy className="h-10 w-10 stroke-[1.5]" />
              <div className="absolute -bottom-2 -root-2 bg-white text-indigo-600 p-2 rounded-full shadow-md ring-1 ring-slate-100 animate-bounce">
                <ImageIcon className="h-5 w-5" />
              </div>
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-6 w-6 text-amber-400 animate-pulse" />
          </div>

          <Badge className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-sm px-3 py-1">Coming Soon</Badge>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Results Poster Generator
          </h2>
          
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8">
            We&apos;re building a dedicated studio to instantly generate and download beautifully crafted official result posters for all Sahityolsav contests.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            <div className="flex items-center justify-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                 <Copy className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Select Event</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                 <Download className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Export HD Poster</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
