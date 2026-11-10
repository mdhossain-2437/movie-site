"use client";

import { useEffect, useRef } from "react";
import type { CinevaDatabaseFilm } from "@/lib/catalogue/cineva-database";

export interface CinemaCanvasReelProps {
  title: string;
  preset: CinevaDatabaseFilm["visualPreset"];
  currentTime: number;
  playing: boolean;
  muted: boolean;
  volume: number;
  activeChapterTitle?: string;
}

export function CinemaCanvasReel({
  title,
  preset,
  currentTime,
  playing,
  muted,
  volume,
  activeChapterTitle,
}: CinemaCanvasReelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(currentTime);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    timeRef.current = currentTime;
  }, [currentTime]);

  // Procedural WebAudio ambient cinema score (only active when playing & unmuted in real browsers)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!playing || muted || volume <= 0) {
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.15);
      }
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0.0001;
        master.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 260;

        osc1.type = "sawtooth";
        osc2.type = "triangle";
        const baseFreq =
          preset === "stellar-voyage" ? 55 : preset === "cyber-acoustic" ? 65.41 : 49.0;
        osc1.frequency.value = baseFreq;
        osc2.frequency.value = baseFreq * 1.5;

        const chordGain = ctx.createGain();
        chordGain.gain.value = 0.14;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(master);

        osc1.start();
        osc2.start();

        audioCtxRef.current = ctx;
        masterGainRef.current = master;
      }

      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume().catch(() => {});
      }
      if (masterGainRef.current) {
        const target = Math.min(0.18, (volume / 100) * 0.16);
        masterGainRef.current.gain.setTargetAtTime(
          Math.max(0.0001, target),
          audioCtxRef.current.currentTime,
          0.25,
        );
      }
    } catch {
      // Browser audio policy or headless test environment without WebAudio hardware
    }
  }, [muted, playing, preset, volume]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        masterGainRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let startWallMs = performance.now();
    let baseMediaTime = timeRef.current;

    const renderFrame = (nowMs: number) => {
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const elapsed = playing && !prefersReducedMotion ? (nowMs - startWallMs) / 1000 : 0;
      const t = baseMediaTime + elapsed;

      // 2.39:1 Anamorphic letterbox geometry inside 16:9 viewport
      const barH = Math.round(h * 0.115);
      const stageTop = barH;
      const stageH = h - barH * 2;
      const horizonY = stageTop + stageH * 0.64;

      // Base pitch black
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Atmospheric sky gradient tailored by preset
      const sky = ctx.createLinearGradient(0, stageTop, 0, stageTop + stageH);
      if (preset === "stellar-voyage") {
        sky.addColorStop(0, "#030306");
        sky.addColorStop(0.55, "#23040A");
        sky.addColorStop(1, "#050204");
      } else if (preset === "cyber-acoustic") {
        sky.addColorStop(0, "#050608");
        sky.addColorStop(0.6, "#28050B");
        sky.addColorStop(1, "#040406");
      } else {
        sky.addColorStop(0, "#090204");
        sky.addColorStop(0.5, "#3A060D");
        sky.addColorStop(0.75, "#7A0B16");
        sky.addColorStop(1, "#080203");
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, stageTop, w, stageH);

      // Anamorphic crimson core glow
      const sunX = w * (0.5 + Math.sin(t * 0.12) * 0.08);
      const sunY = horizonY - stageH * 0.12;
      const radial = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, w * 0.42);
      radial.addColorStop(0, "rgba(254, 249, 239, 0.36)");
      radial.addColorStop(0.22, "rgba(229, 9, 20, 0.48)");
      radial.addColorStop(0.62, "rgba(138, 8, 18, 0.18)");
      radial.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, stageTop, w, stageH);

      // Preset-specific cinematography layers
      if (preset === "stellar-voyage") {
        // Parallax starfield + eclipse ring + orbital telemetry
        for (let i = 0; i < 70; i++) {
          const sx = (((i * 173.7 + t * (4 + (i % 5) * 2)) % w) + w) % w;
          const sy = stageTop + ((i * 97.3) % (stageH * 0.85));
          const alpha = 0.25 + ((i * 31) % 60) / 100;
          ctx.fillStyle = `rgba(254, 249, 239, ${alpha})`;
          ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1.2, i % 4 === 0 ? 2 : 1.2);
        }

        // Eclipse body
        const r = stageH * 0.26;
        ctx.save();
        ctx.strokeStyle = "rgba(229, 9, 20, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w * 0.5, stageTop + stageH * 0.48, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#040203";
        ctx.beginPath();
        ctx.arc(w * 0.5, stageTop + stageH * 0.48, r, 0, Math.PI * 2);
        ctx.fill();

        // Anamorphic horizontal flare
        const flare = ctx.createLinearGradient(w * 0.12, 0, w * 0.88, 0);
        flare.addColorStop(0, "rgba(229, 9, 20, 0)");
        flare.addColorStop(0.48, "rgba(254, 249, 239, 0.55)");
        flare.addColorStop(0.52, "rgba(229, 9, 20, 0.7)");
        flare.addColorStop(1, "rgba(229, 9, 20, 0)");
        ctx.fillStyle = flare;
        ctx.fillRect(w * 0.12, stageTop + stageH * 0.48 - r * 0.98, w * 0.76, 2.5);
        ctx.restore();
      } else if (preset === "cyber-acoustic" || preset === "jamdani-loom") {
        // Oscilloscope / Loom harmonic threads
        for (let line = 0; line < 7; line++) {
          ctx.beginPath();
          ctx.strokeStyle =
            line === 3 ? "rgba(229, 9, 20, 0.88)" : `rgba(254, 249, 239, ${0.14 + line * 0.05})`;
          ctx.lineWidth = line === 3 ? 2.2 : 1;
          for (let x = 0; x <= w; x += 12) {
            const wave =
              Math.sin(x * 0.012 + t * (1.6 + line * 0.22) + line) * (18 + line * 6) +
              Math.cos(x * 0.027 - t * 1.1) * 9;
            const y = stageTop + stageH * 0.5 + (line - 3) * 18 + wave;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        // Sweeping theatrical searchlight beams
        for (let b = 0; b < 2; b++) {
          const baseX = b === 0 ? w * 0.24 : w * 0.76;
          const sway = Math.sin(t * (0.35 + b * 0.15) + b * 2.1) * (w * 0.18);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(baseX, horizonY);
          ctx.lineTo(baseX + sway - w * 0.14, stageTop);
          ctx.lineTo(baseX + sway + w * 0.14, stageTop);
          ctx.closePath();
          const beamGrad = ctx.createLinearGradient(0, horizonY, 0, stageTop);
          beamGrad.addColorStop(0, "rgba(254, 249, 239, 0.20)");
          beamGrad.addColorStop(0.5, "rgba(229, 9, 20, 0.09)");
          beamGrad.addColorStop(1, "rgba(229, 9, 20, 0)");
          ctx.fillStyle = beamGrad;
          ctx.fill();
          ctx.restore();
        }

        // Architectural bridge / colonnade skyline silhouette
        ctx.fillStyle = "#060203";
        for (let col = 0; col < 18; col++) {
          const parallaxX =
            ((((col * (w / 14) - t * 14) % (w + 120)) + (w + 120)) % (w + 120)) - 60;
          const bh = 28 + ((col * 37) % 74);
          const bw = 38 + ((col * 19) % 34);
          ctx.fillRect(parallaxX, horizonY - bh, bw, bh);
        }

        // Passing river barge silhouette
        const bargeX = ((t * 26) % (w + 260)) - 130;
        ctx.fillStyle = "#030102";
        ctx.beginPath();
        ctx.moveTo(bargeX - 75, horizonY + 8);
        ctx.lineTo(bargeX + 85, horizonY + 8);
        ctx.lineTo(bargeX + 68, horizonY + 22);
        ctx.lineTo(bargeX - 62, horizonY + 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(bargeX - 18, horizonY - 8, 34, 16);
        // Crimson signal lamp on barge
        ctx.fillStyle = "#E50914";
        ctx.fillRect(bargeX + 10, horizonY - 4, 4, 4);

        // River water reflection shimmer
        const water = ctx.createLinearGradient(0, horizonY, 0, stageTop + stageH);
        water.addColorStop(0, "rgba(28, 4, 8, 0.92)");
        water.addColorStop(1, "#020102");
        ctx.fillStyle = water;
        ctx.fillRect(0, horizonY, w, stageTop + stageH - horizonY);

        for (let r = 0; r < 26; r++) {
          const ry = horizonY + 6 + r * ((stageTop + stageH - horizonY - 8) / 26);
          const spread = (1 - r / 26) * w * 0.24 + 24;
          const rx = sunX - spread / 2 + Math.sin(t * 2.4 + r * 0.9) * 14;
          ctx.fillStyle = r % 3 === 0 ? "rgba(254, 249, 239, 0.22)" : "rgba(229, 9, 20, 0.28)";
          ctx.fillRect(rx, ry, spread, 1.6);
        }

        // Monsoon rain streaks
        if (
          preset === "monsoon-noir" ||
          preset === "river-thriller" ||
          preset === "crimson-express"
        ) {
          ctx.strokeStyle = "rgba(254, 249, 239, 0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let d = 0; d < 65; d++) {
            const dx = ((d * 89 + t * 260) % (w + 80)) - 40;
            const dy = stageTop + ((d * 67 + t * 520) % stageH);
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx - 9, dy + 22);
          }
          ctx.stroke();
        }
      }

      // Opening 6-second CINEVA Theatrical Title Card Leader
      if (t < 6.5) {
        const alpha = t < 5 ? 0.92 : Math.max(0, ((6.5 - t) / 1.5) * 0.92);
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.62})`;
        ctx.fillRect(0, stageTop, w, stageH);

        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(229, 9, 20, ${alpha})`;
        ctx.font = "700 12px monospace";
        ctx.fillText("CINEVA ORIGINAL PRESENTATION · 2.39:1 ANAMORPHIC", w / 2, h * 0.43);

        ctx.fillStyle = `rgba(254, 249, 239, ${alpha})`;
        ctx.font = "600 38px sans-serif";
        ctx.fillText(title.toUpperCase(), w / 2, h * 0.52);
        ctx.restore();
      } else if (activeChapterTitle) {
        // Subtle top-left chapter watermark stamp
        ctx.save();
        ctx.fillStyle = "rgba(254, 249, 239, 0.42)";
        ctx.font = "600 11px monospace";
        ctx.fillText(activeChapterTitle.toUpperCase(), 28, stageTop + 26);
        ctx.restore();
      }

      // Crisp 2.39:1 Anamorphic Matte Bars
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, h - barH, w, barH);

      if (playing && !prefersReducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    startWallMs = performance.now();
    baseMediaTime = timeRef.current;
    renderFrame(startWallMs);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [activeChapterTitle, playing, preset, title]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      aria-hidden="true"
      data-testid="cinema-canvas-reel"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}
