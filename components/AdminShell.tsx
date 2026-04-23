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
    <div className="flex min-h-screen bg-slate-100/80">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white text-slate-900 shadow-xl transition-[width,transform] duration-300 ease-out lg:static lg:translate-x-0 lg:flex lg:flex-col",
          desktopCollapsed ? "lg:w-20" : "lg:w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 text-slate-900 font-bold text-xl tracking-tight transition-all duration-300 group hover:text-slate-700",
              desktopCollapsed && "lg:mx-auto lg:gap-0"
            )}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 group-hover:scale-105">
              <Image src="/SAHITYOTSAV LOGO.png" fill alt="Sahityolsav Logo" className="object-contain" sizes="32px" />
            </div>
            {!desktopCollapsed && <span className="translate-y-[0.5px]">Admin Center</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:flex transition-colors"
            onClick={toggleDesktopSidebar}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
          <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-2">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={desktopCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex w-full items-center overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    desktopCollapsed ? "lg:justify-center lg:px-0" : "justify-between",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-1 left-0 w-1 rounded-r-full transition-all duration-300",
                      active ? "bg-white/80 opacity-100" : "bg-transparent opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    {!desktopCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!desktopCollapsed && active && <ChevronRight className="w-4 h-4 opacity-90" />}
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
