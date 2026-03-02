import { SentimentSignal } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  injury: "\u{1F3E5}",
  suspension: "\u{1F6AB}",
  rotation: "\u{1F504}",
  venue: "\u{1F3DF}\u{FE0F}",
  travel: "\u{2708}\u{FE0F}",
  positive: "\u{2705}",
};

const SEVERITY_STYLES: Record<string, string> = {
  red: "bg-danger/15 text-danger",
  yellow: "bg-amber-500/15 text-amber-400",
  green: "bg-success/15 text-success",
};

export default function SentimentBadges({
  signals,
  compact = true,
}: {
  signals: SentimentSignal[];
  compact?: boolean;
}) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {signals.map((signal, i) => (
        <span
          key={`${signal.category}-${i}`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[signal.severity] || SEVERITY_STYLES.yellow}`}
          title={signal.detail || signal.label}
        >
          <span className="text-[11px]">
            {CATEGORY_ICONS[signal.category] || "\u{2139}\u{FE0F}"}
          </span>
          {signal.label}
          {!compact && signal.detail && (
            <span className="font-normal opacity-80 ml-0.5">
              — {signal.detail}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
