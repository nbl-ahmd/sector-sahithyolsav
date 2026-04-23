"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  Home,
  Settings,
  SlidersHorizontal,
  CalendarDays,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Back to Public Site", icon: Home },
  { href: "/admin", label: "Template Dashboard", icon: Settings, exact: true },
  { href: "/admin/counts", label: "Manual Counts", icon: SlidersHorizontal },
  { href: "/admin/settings", label: "App Settings", icon: CalendarDays },
];

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("admin.sidebar.collapsed") === "1";
  });

  const toggleDesktopSidebar = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("admin.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  };

  const onLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/80 overflow-hidden">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform border-r border-slate-200/80 bg-white/95 backdrop-blur-xl text-slate-900 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:translate-x-0 lg:flex lg:flex-col",
          desktopCollapsed ? "lg:w-[88px]" : "lg:w-72",
          mobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
        )}
      >
        <div className={cn("relative flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 px-6 transition-all duration-500", desktopCollapsed && "px-0 justify-center")}>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 text-slate-900 font-bold text-[19px] tracking-tight transition-all duration-500 group hover:opacity-80",
              desktopCollapsed && "justify-center w-full"
            )}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-50 shadow-sm border border-slate-200 transition-all duration-500 group-hover:scale-105 group-hover:shadow-md group-hover:bg-white group-active:scale-95">
              <Image src="/SAHITYOTSAV LOGO.png" fill alt="Sahityolsav Logo" className="object-contain p-1.5" sizes="40px" />
            </div>
            <div className={cn("flex flex-col whitespace-nowrap transition-all duration-500", desktopCollapsed ? "opacity-0 w-0 translate-x-4 hidden" : "opacity-100 w-auto translate-x-0")}>
              <span className="leading-tight">Admin Center</span>
              <span className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase leading-tight">Control Panel</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 lg:hidden", desktopCollapsed && "hidden")}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("hidden lg:flex text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 shrink-0", desktopCollapsed && "absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full border border-slate-200 bg-white shadow-sm z-50 hover:bg-slate-50")}
            onClick={toggleDesktopSidebar}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5 text-slate-600" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          </Button>
        </div>

        <div className="relative flex flex-1 flex-col overflow-y-auto px-3 py-6">
          {!desktopCollapsed && (
            <div className="px-3 pb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Management
              </p>
            </div>
          )}
          <nav className="space-y-1 py-2">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={desktopCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex w-full items-center overflow-hidden rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                    desktopCollapsed ? "lg:justify-center lg:px-0" : "justify-between",
                    active
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-1.5 left-0 w-1 rounded-r-full transition-all duration-300",
                      active ? "bg-white/80 opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-transparent opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        active ? "text-white scale-110" : "text-slate-500 group-hover:text-slate-700 group-hover:scale-105"
                      )}
                    />
                    {!desktopCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!desktopCollapsed && active && <ChevronRight className="w-4 h-4 opacity-90 transition-transform duration-300 translate-x-1" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            {desktopCollapsed ? (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition-transform duration-300">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">System Admin</p>
                    <p className="truncate text-xs text-emerald-700">Secure session active</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  Keep template updates consistent before sharing links with unit coordinators.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 h-8 w-full border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  onClick={onLogout}
                >
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 text-slate-600"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admin Center</p>
            <p className="truncate text-base font-bold tracking-tight text-slate-900">{title}</p>
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto transition-all">
          <div className="mx-auto h-full w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Family Sahityolsav</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-500">{subtitle}</p>}
            </div>

            <div className="relative w-full animate-in fade-in duration-700 pb-14">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
