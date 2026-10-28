"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MODEL_URL, type MascotPose, type Mood } from "@/components/marketing/mascot-pose";

// three.js is ~150 KB — only pull it in once we know the .glb actually exists.
const MascotModel = dynamic(() => import("@/components/marketing/MascotModel"), { ssr: false });

// Orbit is "The Marketing Gremlin": mischievous, hyperactive, obsessed with growth.
const LINES = {
  intro: ["heh. I post while you sleep 😈"],
  dodge: ["nope! 😈", "too slow, human", "can't catch me — busy going viral", "hehe. missed."],
  poke: ["MORE CONTENT. MORE GROWTH. 💜", "wheee! drafting your next post…", "boop! it's in your approval queue ✨"],
  doze: ["zzz… 💤"],
  wake: ["huh?! I was NOT sleeping. drafts are ready 😈", "oh hi! your feed missed you 👀"],
};

const PLATFORMS = ["𝕏", "@", "in", "IG"];
// The halo ring around Orbit's head is tilted, like on the character sheet.
const HALO_TILT = (-12 * Math.PI) / 180;
const IDLE_BEFORE_DOZE_MS = 7000;

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Mode =
  | { kind: "look" }
  | { kind: "dodge"; dir: number; until: number }
  | { kind: "doze" }
  | { kind: "jump"; start: number; spin: boolean };

const MOOD: Record<Mode["kind"], Mood> = {
  look: "idle",
  dodge: "mischievous",
  doze: "sleepy",
  jump: "excited",
};

/**
 * The landing-page mascot. One animation loop decides what Orbit is doing —
 * watching the cursor, dodging it when you get too close, dozing off when you
 * go idle, or doing a flip when poked — and feeds that to the 3D model as a
 * pose + mood (public/models/orbit.glb).
 */
export function OrbitMascot({ className = "h-[400px] md:h-[500px]" }: { className?: string }) {
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const haloRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const poseRef = useRef<MascotPose>({ yaw: 0, pitch: 0, spin: 0, mood: "idle" });
  const pokeRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    fetch(MODEL_URL, { method: "HEAD" })
      .then((res) => !cancelled && setHasModel(res.ok))
      .catch(() => !cancelled && setHasModel(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
    const say = (text: string, ms = 2800) => {
      setBubble(text);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => setBubble(null), ms);
    };

    const pointer = { x: 0, y: 0, active: false };
    let lastActivity = performance.now();
    let mode: Mode = { kind: "look" };
    let dodgeCooldown = 0;
    // x/hop are DOM-space (body slides + jumps); yaw/pitch/spin go to the model.
    const cur = { x: 0, hop: 0, yaw: 0, pitch: 0 };

    const onActivity = () => {
      lastActivity = performance.now();
      if (mode.kind === "doze") {
        mode = { kind: "jump", start: lastActivity, spin: false };
        say(pick(LINES.wake));
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer.x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      pointer.y = (e.clientY - (r.top + r.height * 0.45)) / (r.height / 2);
      pointer.active = e.pointerType === "mouse";
      onActivity();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onActivity, { passive: true });

    pokeRef.current = () => {
      if (mode.kind === "jump") return;
      lastActivity = performance.now();
      mode = { kind: "jump", start: lastActivity, spin: true };
      say(pick(LINES.poke));
    };

    const intro = setTimeout(() => say(LINES.intro[0]), 1200);

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const halfW = stage.clientWidth / 2;

      let tx = 0;
      let tyaw = clamp(pointer.x, -1, 1) * 0.55;
      let tpitch = clamp(pointer.y, -1, 1) * 0.25;
      let hop = 0;
      let spin = 0;

      if (!reduced && mode.kind === "look") {
        // Get the cursor too close and Orbit scoots out of the way...
        const near = Math.hypot(pointer.x - cur.x, pointer.y * 0.8) < 0.32;
        if (pointer.active && near && now > dodgeCooldown) {
          const dir = pointer.x > cur.x ? -1 : 1;
          mode = { kind: "dodge", dir, until: now + 1100 };
          dodgeCooldown = now + 3000; // ...but lets you catch it afterwards.
          say(pick(LINES.dodge));
        } else if (now - lastActivity > IDLE_BEFORE_DOZE_MS) {
          mode = { kind: "doze" };
          say(LINES.doze[0], 60_000);
        }
      }

      if (mode.kind === "dodge") {
        tx = mode.dir * 0.42;
        tyaw = -mode.dir * 0.6; // glances back at you while escaping
        hop = 0.15;
        if (now > mode.until) mode = { kind: "look" };
      } else if (mode.kind === "doze") {
        tyaw = Math.sin(t * 0.8) * 0.12;
        tpitch = 0.3; // head droops
      } else if (mode.kind === "jump") {
        const p = Math.min((now - mode.start) / 900, 1);
        const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        spin = mode.spin && !reduced ? eased * Math.PI * 2 : 0;
        hop = Math.sin(p * Math.PI) * (reduced ? 0.1 : mode.spin ? 0.45 : 0.2);
        if (p >= 1) mode = { kind: "look" };
      }

      const k = 1 - Math.exp(-dt * 7);
      cur.x += (tx - cur.x) * k;
      cur.hop += (hop - cur.hop) * k * 1.6;
      cur.yaw += (tyaw - cur.yaw) * k;
      cur.pitch += (tpitch - cur.pitch) * k;
      poseRef.current = { yaw: cur.yaw, pitch: cur.pitch, spin, mood: MOOD[mode.kind] };

      if (bodyRef.current) {
        bodyRef.current.style.transform = `translate3d(${cur.x * halfW}px, ${-cur.hop * 140}px, 0)`;
      }

      // Halo around the head with platform chips riding it; chips on the far
      // side drop behind Orbit (lower z-index) so the ring reads as 3D.
      const rx = Math.min(halfW * 0.62, 230);
      const ry = rx * 0.24;
      for (const halo of haloRefs.current) {
        if (!halo) continue;
        halo.style.width = `${rx * 2}px`;
        halo.style.height = `${ry * 2}px`;
      }
      const cosT = Math.cos(HALO_TILT);
      const sinT = Math.sin(HALO_TILT);
      chipRefs.current.forEach((chip, i) => {
        if (!chip) return;
        const a = (reduced ? 0.6 : t * 0.5) + (i * Math.PI * 2) / PLATFORMS.length;
        const depth = Math.sin(a);
        const ex = Math.cos(a) * rx;
        const ey = depth * ry;
        const x = ex * cosT - ey * sinT;
        const y = ex * sinT + ey * cosT;
        chip.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${0.8 + depth * 0.2})`;
        chip.style.zIndex = depth > 0 ? "30" : "5";
        chip.style.opacity = String(0.6 + (depth + 1) * 0.2);
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onActivity);
      clearTimeout(intro);
      clearTimeout(bubbleTimer);
    };
  }, []);

  const haloClass =
    "pointer-events-none absolute left-1/2 top-[30%] rounded-[50%] [transform:translate(-50%,-50%)_rotate(-12deg)]";

  return (
    <div ref={stageRef} className={`relative mx-auto w-full max-w-4xl select-none ${className}`}>
      {/* Glow behind the character */}
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9147ff]/30 blur-3xl md:h-96 md:w-96" />

      <div className="absolute inset-0 flex justify-center">
        <div ref={bodyRef} className="relative h-full w-[300px] md:w-[440px]">
          {/* Halo — back half sits behind Orbit, front half in front of it */}
          <div
            ref={(el) => {
              haloRefs.current[0] = el;
            }}
            className={`${haloClass} z-[5] border-2 border-[#9147ff]/35 shadow-[0_0_16px_rgba(145,71,255,0.35)]`}
          />
          <div
            ref={(el) => {
              haloRefs.current[1] = el;
            }}
            className={`${haloClass} z-30 border-2 border-[#9147ff]/50 [clip-path:inset(50%_0_0_0)]`}
          />

          {PLATFORMS.map((label, i) => (
            <span
              key={label}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[30%] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-white to-[#f5e8ff] text-sm font-bold text-[#6229ce] shadow-[0_8px_20px_-6px_rgba(98,41,206,0.55),inset_0_-3px_6px_rgba(98,41,206,0.15)]"
            >
              {label}
            </span>
          ))}

          <button
            type="button"
            onClick={() => pokeRef.current()}
            aria-label="Poke Orbit"
            className="relative z-10 h-full w-full cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#9147ff]"
          >
            {hasModel ? (
              <MascotModel poseRef={poseRef} />
            ) : hasModel === false ? (
              // Stand-in until public/models/orbit.glb is added: one of Orbit's antenna orbs.
              <span className="absolute left-1/2 top-[45%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#d4b3ff_35%,#9147ff_75%)] shadow-[0_0_60px_rgba(145,71,255,0.6)]" />
            ) : null}
          </button>

          <div
            aria-live="polite"
            className={`pointer-events-none absolute -right-6 top-2 z-40 max-w-[200px] rounded-2xl rounded-bl-sm border border-[#e5e1ef] bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-[0_12px_30px_-10px_rgba(98,41,206,0.45)] backdrop-blur transition-all duration-300 md:-right-28 ${
              bubble ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-90 opacity-0"
            }`}
          >
            {bubble}
          </div>
        </div>
      </div>
    </div>
  );
}
