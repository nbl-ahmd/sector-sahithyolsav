"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { LayoutDashboard, Users, Trophy, Settings, Menu, X, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/family", label: "Family Layouts", icon: Users },
  { href: "/sector", label: "Live Stats", icon: Trophy },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <div className="bg-primary/10 p-1.5 rounded-lg flex items-center justify-center">
                <Hexagon className="h-5 w-5 text-primary fill-primary" />
              </div>
              <span className="text-slate-900 hidden sm:inline-block">Sahityolsav</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 rounded-full bg-slate-50 py-1 pl-1 pr-3 border border-slate-200">
               <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=ffffff" alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-none">Alex G.</span>
               </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white absolute w-full shadow-lg pb-4 px-4 pt-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-7xl">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="text-base text-slate-500 mt-1.5">{subtitle}</p>}
          </div>
          
          <div className="animate-in fade-in duration-500 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
