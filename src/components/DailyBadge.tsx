interface DailyBadgeProps {
  dayNumber: number;
  date: string; // YYYY-MM-DD
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function prettyDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  return `${month} ${day}`;
}

export function DailyBadge({ dayNumber, date }: DailyBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider">
      <span>Daily #{dayNumber}</span>
      <span className="opacity-50">·</span>
      <span className="normal-case">{prettyDate(date)}</span>
    </span>
  );
}
