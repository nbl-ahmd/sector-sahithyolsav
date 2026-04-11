"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/family", label: "Family" },
  { href: "/admin", label: "Admin" },
  { href: "/sector", label: "Sector" },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <p className="eyebrow">Sector Sahityolsav Studio</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <nav className="nav-pills">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
