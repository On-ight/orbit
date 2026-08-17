const RISK_TIER_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  AUTO: { bg: "var(--status-good-soft)", fg: "var(--status-good)", label: "Auto" },
  APPROVAL: { bg: "var(--status-warning-soft)", fg: "var(--status-warning)", label: "Needs approval" },
  NEVER: { bg: "var(--status-critical-soft)", fg: "var(--status-critical)", label: "Flagged" },
};

const INTENT_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  HIGH: { bg: "var(--status-good-soft)", fg: "var(--status-good)", label: "High intent" },
  MEDIUM: { bg: "var(--status-warning-soft)", fg: "var(--status-warning)", label: "Medium intent" },
  LOW: { bg: "var(--surface-2)", fg: "var(--text-muted)", label: "Low intent" },
};

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: fg }} />
      {label}
    </span>
  );
}

export function RiskBadge({ tier }: { tier: string }) {
  const style = RISK_TIER_STYLES[tier] ?? RISK_TIER_STYLES.APPROVAL;
  return <Pill {...style} />;
}

export function IntentBadge({ intent }: { intent: string }) {
  const style = INTENT_STYLES[intent] ?? INTENT_STYLES.LOW;
  return <Pill {...style} />;
}
