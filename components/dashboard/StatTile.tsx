interface StatTileProps {
  label: string;
  value: number | string;
  isDemoData?: boolean;
}

function formatValue(value: number | string): string {
  if (typeof value === "string") return value;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function StatTile({ label, value, isDemoData }: StatTileProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        {isDemoData && (
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Demo
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{formatValue(value)}</p>
    </div>
  );
}
