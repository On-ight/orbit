"use client";

import { useState } from "react";
import Link from "next/link";
import { REEL_MODES, REEL_MODE_LABELS, type ReelMode } from "@/lib/types";

interface TrendSummary {
  id: string;
  topic: string;
  summary: string;
}

interface CarouselSlide {
  headline: string;
  body: string;
}

interface CarouselVersion {
  angle: string;
  title: string;
  slides: CarouselSlide[];
}

type VersionKey = "versionA" | "versionB" | "versionC";
const VERSION_KEYS: VersionKey[] = ["versionA", "versionB", "versionC"];

type Phase = "idle" | "generating" | "choosing" | "rendering" | "ready" | "failed";

function OptionGrid<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition"
          style={
            value === opt
              ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
              : { borderColor: "var(--border)", color: "var(--text-secondary)" }
          }
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

export function CarouselOpportunityCard({ trend, disabled }: { trend: TrendSummary; disabled: boolean }) {
  const [mode, setMode] = useState<ReelMode>("PRODUCT_LAUNCH");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [carouselId, setCarouselId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<VersionKey, CarouselVersion> | null>(null);
  const [selectedKey, setSelectedKey] = useState<VersionKey>("versionA");

  async function handleGenerate() {
    setPhase("generating");
    setError(null);
    try {
      const res = await fetch("/api/carousels/generate-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, sourceTrendId: trend.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to generate scripts");
      setCarouselId(data.id);
      setVersions(data.versions);
      setPhase("choosing");
    } catch (err) {
      console.error("generate-scripts failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  async function handleSelectVersion() {
    if (!carouselId) return;
    setPhase("rendering");
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carouselId}/select-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionKey: selectedKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to render carousel");
      setPhase("ready");
    } catch (err) {
      console.error("select-version failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setPhase("failed");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Carousel opportunity</p>
      <p className="mt-1 text-sm text-[var(--text-primary)]">{trend.summary || trend.topic}</p>

      {error && (
        <p className="mt-3 rounded-md bg-[var(--status-critical-soft)] px-3 py-2 text-xs text-[var(--status-critical)]">
          {error}
        </p>
      )}

      {phase === "idle" && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Mode</p>
          <OptionGrid options={REEL_MODES} labels={REEL_MODE_LABELS} value={mode} onChange={setMode} />
          <button
            onClick={handleGenerate}
            disabled={disabled}
            title={disabled ? "You've used all the Carousels included in your plan this month" : undefined}
            className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate Carousel →
          </button>
        </div>
      )}

      {phase === "generating" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Writing slide copy…</p>
      )}

      {phase === "choosing" && versions && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {VERSION_KEYS.map((key) => {
              const v = versions[key];
              if (!v) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className="block w-full rounded-lg border p-3 text-left transition"
                  style={
                    selectedKey === key
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                      : { borderColor: "var(--border)" }
                  }
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{v.angle}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{v.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {v.slides.map((s) => s.headline).join(" · ")}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSelectVersion}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Generate Carousel
          </button>
        </div>
      )}

      {phase === "rendering" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Designing your slides…</p>
      )}

      {phase === "ready" && (
        <p className="mt-4 text-sm text-[var(--status-good)]">
          Your Carousel is ready —{" "}
          <Link href="/approvals" className="font-medium hover:underline">
            review it in the approval queue →
          </Link>
        </p>
      )}

      {phase === "failed" && (
        <p className="mt-4 text-sm text-[var(--status-critical)]">Rendering failed. Try again.</p>
      )}
    </div>
  );
}
