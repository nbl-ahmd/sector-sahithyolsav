"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { LayoutDashboard, Users, Trophy, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface AppShellProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/family", label: "Family Layouts", icon: Users },
  { href: "/sector", label: "Live Stats", icon: Trophy },
];

export function AppShell({ title, subtitle, showProfile = false, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-start">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold tracking-[0.04em] text-slate-900 sm:text-sm">
                Karassery
              </span>
              <Image
                src="/Sahithyolsav (en) (2).png"
                alt="Sahithyolsav wordmark"
                width={168}
                height={34}
                className="h-7 sm:h-8 lg:h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4 lg:ml-8">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-slate-900 text-white shadow-md hover:bg-slate-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button - moved inside the flex container to align properly on small screens */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600 ml-auto -mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {showProfile && (
              <div className="hidden sm:flex items-center gap-3 rounded-full bg-slate-50 py-1 pl-1 pr-3 border border-slate-200">
                <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=ffffff" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-none">Alex G.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white absolute w-full shadow-xl pb-6 px-4 pt-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition-all",
                      active
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-400")} />
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
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-2xl mx-auto sm:mx-0 leading-relaxed">{subtitle}</p>}
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
