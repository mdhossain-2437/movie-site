"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDeviceState, useDeviceState } from "@/lib/client/device-state";
import { Icon } from "@/components/ui/icon";

interface ToastMessage {
  text: string;
  id: number;
}
const ToastContext = createContext<(text: string) => void>(() => {});
export const useNotify = () => useContext(ToastContext);

interface Wipe {
  id: number;
  href: string;
  color: string;
  label: string;
  rect: { top: number; right: number; bottom: number; left: number };
}
type BeginWipe = (href: string, color: string, label: string, rect: DOMRect) => boolean;
const WipeContext = createContext<BeginWipe | null>(null);
export const usePosterTransition = () => useContext(WipeContext);

function PreferencesSync() {
  const { reduceMotion, banglaTitles } = useDeviceState();
  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion ? "reduce" : "system";
    document.documentElement.dataset.bangla = banglaTitles ? "show" : "hide";
  }, [reduceMotion, banglaTitles]);
  return null;
}

function WipeLayer({ wipe, finish }: { wipe: Wipe | null; finish: () => void }) {
  const node = useRef<HTMLDivElement>(null);
  const phase = useRef<"cover" | "waiting" | "reveal">("cover");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!wipe || !node.current) return;
    phase.current = "cover";
    const { top, right, bottom, left } = wipe.rect;
    const inset = `${Math.max(0, top)}px ${Math.max(0, window.innerWidth - right)}px ${Math.max(0, window.innerHeight - bottom)}px ${Math.max(0, left)}px`;
    const animation = node.current.animate(
      [{ clipPath: `inset(${inset} round 3px)` }, { clipPath: "inset(0px round 0px)" }],
      { duration: 360, easing: "cubic-bezier(.22,.7,.18,1)", fill: "both" },
    );
    animation.onfinish = () => {
      phase.current = "waiting";
      router.push(wipe.href);
    };
    const safety = window.setTimeout(finish, 6000);
    return () => {
      animation.cancel();
      window.clearTimeout(safety);
    };
  }, [wipe, finish, router]);

  useEffect(() => {
    if (!wipe || !node.current || phase.current !== "waiting") return;
    // Reveal on navigation, including an interrupted destination (e.g. browser back).
    phase.current = "reveal";
    const animation = node.current.animate(
      [{ clipPath: "inset(0% 0 0 0)" }, { clipPath: "inset(0% 0 100% 0)" }],
      { duration: 360, easing: "cubic-bezier(.22,.7,.18,1)", fill: "forwards" },
    );
    animation.onfinish = finish;
    return () => animation.cancel();
  }, [pathname, wipe, finish]);

  if (!wipe) return null;
  return (
    <div ref={node} className="poster-wipe" style={{ background: wipe.color }} aria-hidden="true">
      <span className="poster-wipe-label">{wipe.label}</span>
      <span className="poster-wipe-caption">Cinematic Graphite / The archive</span>
    </div>
  );
}

export function ExperienceProviders({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [wipe, setWipe] = useState<Wipe | null>(null);
  const sequence = useRef(0);
  const notify = useCallback((text: string) => {
    sequence.current += 1;
    setToast({ text, id: sequence.current });
  }, []);
  const finish = useCallback(() => setWipe(null), []);
  const begin = useCallback<BeginWipe>((href, color, label, rect) => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      getDeviceState().reduceMotion ||
      !Element.prototype.animate ||
      window.location.pathname === href
    )
      return false;
    sequence.current += 1;
    setWipe({
      id: sequence.current,
      href,
      color,
      label,
      rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    });
    return true;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={notify}>
      <WipeContext value={begin}>
        <PreferencesSync />
        {children}
        <Suspense fallback={null}>
          <WipeLayer wipe={wipe} finish={finish} />
        </Suspense>
        <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
          {toast ? (
            <div className="cg-toast" key={toast.id}>
              <Icon name="check" />
              <span>{toast.text}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToast(null)}
              >
                <Icon name="close" />
              </button>
            </div>
          ) : null}
        </div>
      </WipeContext>
    </ToastContext>
  );
}
