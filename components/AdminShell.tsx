"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { Home, Users, Settings, Trophy, Menu, X, Hexagon, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Back to Public Site", icon: Home },
  { href: "/admin", label: "Dashboard", icon: Settings },
];

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 shrink-0 items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3 text-white font-bold text-xl tracking-tight hover:text-white/90 transition-colors group">
            <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
              <Hexagon className="h-6 w-6 text-primary fill-primary" />
            </div>
            <span>Admin Center</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden text-slate-400 hover:text-white hover:bg-slate-800" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 py-8 flex-1 overflow-y-auto">
          <div className="px-8 pb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Management
            </p>
          </div>
          <nav className="flex-1 space-y-1.5 px-4 w-full">
            {navItems.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : false;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 group w-full",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                     <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                     <span className="truncate">{item.label}</span>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Bottom profile area side */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 rounded-xl p-3 hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700/50">
             <div className="h-10 w-10 rounded-full bg-white border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=ffffff`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-bold text-slate-100 truncate">System Admin</span>
                <span className="text-xs font-medium text-slate-500 truncate text-emerald-400">Online • Active</span>
              </div>
              <LogOut className="w-4 h-4 text-slate-500 hover:text-red-400 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
        
        {/* Top Header Mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white/80 backdrop-blur-md px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 text-slate-600"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="font-semibold text-slate-900 text-lg tracking-tight">Admin Dashboard</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full overflow-y-auto w-full transition-all">
          <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 w-full h-full">
            <div className="mb-8 hidden lg:block">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="text-base text-slate-500 mt-2 max-w-3xl leading-relaxed">{subtitle}</p>}
            </div>
            
            {/* Main Area Injection */}
            <div className="animate-in fade-in duration-700 relative w-full pb-16">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}