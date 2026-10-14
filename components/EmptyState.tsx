import Image from "next/image";

const MASCOT_SRC = {
  wave: "/mascot/orbit-mascot-wave.png",
  confused: "/mascot/orbit-mascot-confused.png",
} as const;

/**
 * Shared "nothing here yet" illustration — "wave" for a friendly all-caught-
 * up moment (nothing pending, no items yet), "confused" for a genuine dead
 * end (404). Kept to these two spots deliberately rather than sprinkled
 * everywhere, so the mascot stays a moment, not wallpaper.
 */
export function EmptyState({
  mascot,
  title,
  description,
}: {
  mascot: keyof typeof MASCOT_SRC;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-6 py-10 text-center">
      <Image src={MASCOT_SRC[mascot]} alt="" aria-hidden width={140} height={140} className="h-28 w-28 object-contain" />
      <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
    </div>
  );
}
