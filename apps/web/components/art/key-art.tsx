import { useId } from "react";
import type { ArtSpec } from "@/lib/catalogue/types";
import { SCENES, type SceneContext } from "./scenes";

export type KeyArtVariant = "poster" | "backdrop";

const CANVAS: Readonly<Record<KeyArtVariant, { w: number; h: number; s: number; x: number }>> = {
  poster: { w: 400, h: 600, s: 1, x: 0 },
  backdrop: { w: 1600, h: 900, s: 1.5, x: 880 },
};

/** Small deterministic PRNG (mulberry32 over an FNV-1a seed) so artwork never changes between renders. */
function createRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface KeyArtProps {
  spec: ArtSpec;
  variant?: KeyArtVariant;
  className?: string;
}

/**
 * Operator-generated key art. Decorative by design: titles and descriptions are always rendered
 * as real text next to the artwork, so the SVG is hidden from assistive technology.
 */
export function KeyArt({ spec, variant = "poster", className }: KeyArtProps) {
  const uid = `ka${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const canvas = CANVAS[variant];
  const { palette: p } = spec;
  const id = (name: string) => `${uid}-${name}`;
  const ctx: SceneContext = {
    p,
    w: canvas.w,
    h: canvas.h,
    s: canvas.s,
    fx: (x) => canvas.x + x * canvas.s,
    fy: (y) => y * canvas.s,
    id,
    url: (name) => `url(#${id(name)})`,
    option: spec.option,
    rand: createRandom(`${spec.motif}:${spec.option ?? ""}:${variant}:${p.accent}`),
  };
  const scene = SCENES[spec.motif](ctx);

  return (
    <svg
      viewBox={`0 0 ${canvas.w} ${canvas.h}`}
      preserveAspectRatio={variant === "poster" ? "xMidYMid slice" : "xMaxYMid slice"}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <radialGradient id={id("glow")}>
          <stop offset="0" stopColor={p.light} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.light} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("vignette")} cx="50%" cy="45%" r="75%">
          <stop offset="0.55" stopColor={p.ink} stopOpacity="0" />
          <stop offset="1" stopColor={p.ink} stopOpacity="0.6" />
        </radialGradient>
        {scene.defs}
      </defs>
      <rect width={canvas.w} height={canvas.h} fill={ctx.url("sky")} />
      {scene.field}
      <g
        transform={
          canvas.x || canvas.s !== 1 ? `translate(${canvas.x} 0) scale(${canvas.s})` : undefined
        }
      >
        {scene.focal}
      </g>
      <rect width={canvas.w} height={canvas.h} fill={ctx.url("vignette")} />
    </svg>
  );
}
