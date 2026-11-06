"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { getDeviceState } from "@/lib/client/device-state";

export function ScrollRail({ children, label }: { children: ReactNode; label: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const measure = () => {
      const position = Math.abs(element.scrollLeft);
      setEdges({
        start: position < 4,
        end: position + element.clientWidth >= element.scrollWidth - 4,
      });
    };
    const frame = requestAnimationFrame(measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);
  function move(direction: number) {
    if (!rail.current) return;
    const reduce =
      getDeviceState().reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(rail.current).direction === "rtl";
    rail.current.scrollBy({
      left: rail.current.clientWidth * 0.75 * direction * (rtl ? -1 : 1),
      behavior: reduce ? "instant" : "smooth",
    });
  }
  return (
    <div className="rail-wrap">
      <div className="rail-controls">
        <button
          type="button"
          className="icon-button"
          onClick={() => move(-1)}
          disabled={edges.start}
          aria-label={`Previous ${label}`}
        >
          <Icon name="arrow-left" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => move(1)}
          disabled={edges.end}
          aria-label={`Next ${label}`}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <div ref={rail} className="poster-rail" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
