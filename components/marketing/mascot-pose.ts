// Shared between OrbitMascot (which decides what the mascot is doing) and
// MascotModel (which only renders it), so the 3D bundle stays lazy-loaded.

export const MODEL_URL = "/models/orbit.glb";

/** Matches the expression sheet; the model plays an animation clip with this word in its name, if it has one. */
export type Mood = "idle" | "mischievous" | "excited" | "sleepy";

export interface MascotPose {
  /** Head turn toward/away from the cursor, radians. */
  yaw: number;
  /** Nod up/down, radians. */
  pitch: number;
  /** Extra full-body spin for the poke/flip trick, radians. */
  spin: number;
  mood: Mood;
}
