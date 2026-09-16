"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  REEL_MODES,
  REEL_MODE_LABELS,
  REEL_STYLES,
  REEL_STYLE_LABELS,
  REEL_VOICE_GENDERS,
  REEL_VOICE_TONES,
  type ReelMode,
  type ReelStyle,
  type ReelVoiceGender,
  type ReelVoiceTone,
} from "@/lib/types";

interface TrendSummary {
  id: string;
  topic: string;
  summary: string;
}

interface ReelScriptVersion {
  angle: string;
  title: string;
  durationSeconds: number;
  hook: string;
}

type VersionKey = "versionA" | "versionB" | "versionC";
const VERSION_KEYS: VersionKey[] = ["versionA", "versionB", "versionC"];

type Phase = "idle" | "generating" | "choosing" | "selecting" | "rendering" | "ready" | "failed";

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

const POLL_INTERVAL_MS = 5000;

export function ReelOpportunityCard({ trend, disabled }: { trend: TrendSummary; disabled: boolean }) {
  const [mode, setMode] = useState<ReelMode>("PRODUCT_LAUNCH");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<VersionKey, ReelScriptVersion> | null>(null);
  const [selectedKey, setSelectedKey] = useState<VersionKey>("versionA");
  const [style, setStyle] = useState<ReelStyle>("PRODUCT");
  const [voiceGender, setVoiceGender] = useState<ReelVoiceGender>("FEMALE");
  const [voiceTone, setVoiceTone] = useState<ReelVoiceTone>("PROFESSIONAL");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollStatus(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/reels/${id}/status`);
        const data = await res.json();
        if (data.status === "READY") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase("ready");
        } else if (data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase("failed");
        }
      } catch {
        // transient network hiccup — keep polling, next tick may succeed
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerate() {
    setPhase("generating");
    setError(null);
    try {
      const res = await fetch("/api/reels/generate-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, sourceTrendId: trend.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to generate scripts");
      setReelId(data.id);
      setVersions(data.versions);
      setPhase("choosing");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  async function handleSelectVersion() {
    if (!reelId) return;
    setPhase("selecting");
    setError(null);
    try {
      const res = await fetch(`/api/reels/${reelId}/select-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionKey: selectedKey, style, voiceGender, voiceTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to start rendering");
      setPhase("rendering");
      pollStatus(reelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("choosing");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Reel opportunity</p>
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
            title={disabled ? "You've used all the Reels included in your plan this month" : undefined}
            className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate Reel →
          </button>
        </div>
      )}

      {phase === "generating" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Writing script options…</p>
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
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">&quot;{v.hook}&quot;</p>
                </button>
              );
            })}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Style</p>
            <OptionGrid options={REEL_STYLES} labels={REEL_STYLE_LABELS} value={style} onChange={setStyle} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Voice</p>
            <div className="flex flex-wrap gap-2">
              <OptionGrid
                options={REEL_VOICE_GENDERS}
                labels={{ FEMALE: "Female", MALE: "Male" }}
                value={voiceGender}
                onChange={setVoiceGender}
              />
              <OptionGrid
                options={REEL_VOICE_TONES}
                labels={{
                  PROFESSIONAL: "Professional",
                  ENERGETIC: "Energetic",
                  CALM: "Calm",
                  CONVERSATIONAL: "Conversational",
                }}
                value={voiceTone}
                onChange={setVoiceTone}
              />
            </div>
          </div>

          <button
            onClick={handleSelectVersion}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Generate Reel
          </button>
        </div>
      )}

      {phase === "selecting" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Starting render…</p>
      )}

      {phase === "rendering" && (
        <div className="mt-4 space-y-1 text-sm text-[var(--text-muted)]">
          <p>✦ Orbit is creating your Reel — this usually takes a couple of minutes.</p>
        </div>
      )}

      {phase === "ready" && (
        <p className="mt-4 text-sm text-[var(--status-good)]">
          Your Reel is ready —{" "}
          <Link href="/approvals" className="font-medium hover:underline">
            review it in the approval queue →
          </Link>
        </p>
      )}

      {phase === "failed" && (
        <p className="mt-4 text-sm text-[var(--status-critical)]">
          Rendering failed. Try again, or check that your Creatomate/ElevenLabs setup is configured correctly.
        </p>
      )}
    </div>
  );
}
