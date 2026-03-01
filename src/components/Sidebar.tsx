"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Home, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

interface NavItem {
  code: string;
  name: string;
  flag: string;
  sports: string[];
}

export default function Sidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card p-2 rounded-lg border border-border"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-border z-40 flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-5 border-b border-border"
          onClick={() => setOpen(false)}
        >
          <Zap size={24} className="text-accent" />
          <span className="text-xl font-bold tracking-tight">PULSE</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground hover:bg-card"
            )}
          >
            <Home size={18} />
            All News
          </Link>

          <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wider text-muted">
            Countries
          </div>

          {navItems.map((item) => {
            const countryPath = `/${item.code}`;
            const isActive =
              pathname === countryPath || pathname.startsWith(`${countryPath}/`);

            return (
              <div key={item.code}>
                <Link
                  href={countryPath}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground hover:bg-card"
                  )}
                >
                  <span className="text-base">{item.flag}</span>
                  {item.name}
                </Link>

                {/* Sport sub-links when country is active */}
                {isActive && item.sports.length > 1 && (
                  <div className="ml-8 mb-1">
                    {item.sports.map((sport) => {
                      const sportPath = `/${item.code}/${sport}`;
                      return (
                        <Link
                          key={sport}
                          href={sportPath}
                          onClick={() => setOpen(false)}
                          className={clsx(
                            "block px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize",
                            pathname === sportPath
                              ? "text-accent"
                              : "text-muted hover:text-foreground"
                          )}
                        >
                          {sport}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border text-xs text-muted">
          Sports News Aggregator
        </div>
      </aside>
    </>
  );
}
