"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

interface FilterBarProps {
  sports: string[];
  currentSport?: string;
  timeOptions?: number[];
  currentHours?: number;
}

export default function FilterBar({
  sports,
  currentSport,
  timeOptions = [6, 12, 24, 48],
  currentHours,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sport filters */}
      {sports.length > 1 && (
        <>
          <button
            onClick={() => setParam("sport", null)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              !currentSport
                ? "bg-accent text-black"
                : "bg-card border border-border text-muted hover:text-foreground"
            )}
          >
            All Sports
          </button>
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setParam("sport", sport)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                currentSport === sport
                  ? "bg-accent text-black"
                  : "bg-card border border-border text-muted hover:text-foreground"
              )}
            >
              {sport}
            </button>
          ))}
        </>
      )}

      {/* Time filters */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-xs text-muted mr-1">Last:</span>
        {timeOptions.map((h) => (
          <button
            key={h}
            onClick={() => setParam("hours", currentHours === h ? null : String(h))}
            className={clsx(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              currentHours === h
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-foreground"
            )}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  );
}
