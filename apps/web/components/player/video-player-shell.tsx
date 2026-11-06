"use client";

import type { ResolutionTier } from "@movie/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Spinner } from "@/components/ui";

export type PlayerLifecycleState =
  | "IDLE"
  | "AUTHORIZING"
  | "PREPARING"
  | "BUFFERING"
  | "PLAYING"
  | "PAUSED"
  | "ENDED"
  | "REVOKED"
  | "ERROR";

export type PlayerErrorCategory =
  | "AUTHORIZATION_FAILURE"
  | "SESSION_TIMEOUT"
  | "BUFFER_STARVATION"
  | "DRM_LICENSE_DENIAL"
  | "NETWORK_DROP"
  | "INCOMPATIBLE_DEVICE_CDM"
  | "RIGHTS_WINDOW_EXPIRED"
  | "CONCURRENCY_LIMIT_REACHED";

interface AuthorizedRendition {
  id: string;
  resolution: ResolutionTier;
  codec: string;
  bitrateKbps: number;
  manifestUrl: string;
}

interface AuthorizedSubtitle {
  id: string;
  languageCode: string;
  label: string;
  isForced: boolean;
  vttUrl: string;
}

interface AuthorizedSessionPayload {
  sessionId: string;
  playbackToken: string;
  expiresAt: string;
  maxResolution: ResolutionTier;
  requiresDrm: boolean;
  resumePositionSeconds: number;
  durationSeconds: number;
  renditions: AuthorizedRendition[];
  subtitles: AuthorizedSubtitle[];
  securityDisclosure: string;
}

function classifyProblemCode(code?: string): PlayerErrorCategory {
  switch (code) {
    case "DRM_REQUIRED":
      return "DRM_LICENSE_DENIAL";
    case "CONCURRENT_SESSION_LIMIT":
      return "CONCURRENCY_LIMIT_REACHED";
    case "RIGHTS_EXPIRED":
      return "RIGHTS_WINDOW_EXPIRED";
    case "SESSION_EXPIRED":
      return "SESSION_TIMEOUT";
    default:
      return "AUTHORIZATION_FAILURE";
  }
}

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function VideoPlayerShell({
  titleSlug,
  localizedTitle,
  runtimeMinutes,
}: {
  titleSlug: string;
  localizedTitle: string;
  runtimeMinutes: number;
}) {
  const [playerState, setPlayerState] = useState<PlayerLifecycleState>("IDLE");
  const [errorInfo, setErrorInfo] = useState<{
    category: PlayerErrorCategory;
    detail: string;
  } | null>(null);
  const [sessionData, setSessionData] = useState<AuthorizedSessionPayload | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionTier | "AUTO">("AUTO");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(runtimeMinutes * 60);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const authStartTimeRef = useRef<number>(0);
  const firstFrameEmittedRef = useRef<boolean>(false);

  const emitQoeEvent = useCallback(
    async (
      eventType: "MANIFEST_LOADED" | "FIRST_FRAME" | "PLAYBACK_ERROR" | "ENDED",
      payloadOverrides?: {
        startupLatencyMs?: number;
        errorCode?: string;
        renditionProfile?: string;
      },
    ) => {
      if (!sessionData) return;
      try {
        await fetch(`/api/v1/playback-sessions/${encodeURIComponent(sessionData.sessionId)}/qoe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playbackToken: sessionData.playbackToken,
            eventType,
            startupLatencyMs: payloadOverrides?.startupLatencyMs,
            errorCode: payloadOverrides?.errorCode,
            renditionProfile:
              payloadOverrides?.renditionProfile ??
              (selectedResolution === "AUTO" ? sessionData.maxResolution : selectedResolution),
          }),
        });
      } catch {
        // QoE telemetry drops must never disrupt video presentation
      }
    },
    [selectedResolution, sessionData],
  );

  const sendHeartbeat = useCallback(
    async (
      posSeconds: number,
      allowBackwardSeek = false,
      eventType: "FIRST_FRAME" | "HEARTBEAT" | "RENDITION_SWITCH" = "HEARTBEAT",
    ) => {
      if (!sessionData) return;
      try {
        const res = await fetch(
          `/api/v1/playback-sessions/${encodeURIComponent(sessionData.sessionId)}/heartbeat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playbackToken: sessionData.playbackToken,
              positionSeconds: posSeconds,
              allowBackwardSeek,
              qoeEvent: {
                eventType,
                activeResolution:
                  selectedResolution === "AUTO" ? sessionData.maxResolution : selectedResolution,
              },
            }),
          },
        );

        if (!res.ok) {
          const problem = (await res.json().catch(() => ({}))) as {
            code?: string;
            detail?: string;
          };
          if (problem.code === "TAKEDOWN_HOLD_ACTIVE" || problem.code === "SESSION_REVOKED") {
            videoRef.current?.pause();
            setPlayerState("REVOKED");
            setErrorInfo({
              category: "RIGHTS_WINDOW_EXPIRED",
              detail:
                problem.detail ?? "Playback session was revoked due to a rights or legal hold.",
            });
            void emitQoeEvent("PLAYBACK_ERROR", { errorCode: problem.code });
          } else if (problem.code === "SESSION_EXPIRED") {
            videoRef.current?.pause();
            setPlayerState("ERROR");
            setErrorInfo({
              category: "SESSION_TIMEOUT",
              detail: "Short-lived playback authorization expired. Re-authorize to continue.",
            });
            void emitQoeEvent("PLAYBACK_ERROR", { errorCode: "SESSION_EXPIRED" });
          }
        }
      } catch {
        // Transient telemetry drop; next heartbeat will retry
      }
    },
    [emitQoeEvent, selectedResolution, sessionData],
  );

  const requestPlaybackAuthorization = useCallback(async () => {
    setPlayerState("AUTHORIZING");
    setErrorInfo(null);
    authStartTimeRef.current = Date.now();
    firstFrameEmittedRef.current = false;

    const drmCapable =
      typeof navigator !== "undefined" && "requestMediaKeySystemAccess" in navigator;

    try {
      const res = await fetch("/api/v1/playback-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleSlug,
          drmCapableClient: drmCapable,
        }),
      });

      const payload = (await res.json()) as AuthorizedSessionPayload & {
        code?: string;
        detail?: string;
      };

      if (!res.ok) {
        const category = classifyProblemCode(payload.code);
        setPlayerState(payload.code === "TAKEDOWN_HOLD_ACTIVE" ? "REVOKED" : "ERROR");
        setErrorInfo({
          category,
          detail:
            payload.detail ?? "Playback is not currently authorized for this title or region.",
        });
        return;
      }

      setSessionData(payload);
      setDuration(payload.durationSeconds || runtimeMinutes * 60);
      setCurrentTime(payload.resumePositionSeconds || 0);
      if (payload.subtitles[0]) {
        setSelectedSubtitleId(payload.subtitles[0].id);
      }
      setPlayerState("PREPARING");
      setPlayerState("PAUSED");

      // Emit MANIFEST_LOADED QoE telemetry
      const manifestLatency = Date.now() - authStartTimeRef.current;
      void fetch(`/api/v1/playback-sessions/${encodeURIComponent(payload.sessionId)}/qoe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbackToken: payload.playbackToken,
          eventType: "MANIFEST_LOADED",
          startupLatencyMs: manifestLatency,
          renditionProfile: payload.maxResolution,
        }),
      }).catch(() => {});
    } catch {
      setPlayerState("ERROR");
      setErrorInfo({
        category: "NETWORK_DROP",
        detail: "Network connection interrupted while requesting playback authorization.",
      });
    }
  }, [runtimeMinutes, titleSlug]);

  const togglePlayPause = useCallback(() => {
    if (playerState === "IDLE") {
      void requestPlaybackAuthorization();
      return;
    }
    if (playerState === "PAUSED" || playerState === "ENDED") {
      setPlayerState("PLAYING");
      void videoRef.current?.play().catch(() => {});
      if (!firstFrameEmittedRef.current && sessionData) {
        firstFrameEmittedRef.current = true;
        const latency = authStartTimeRef.current ? Date.now() - authStartTimeRef.current : 0;
        void emitQoeEvent("FIRST_FRAME", { startupLatencyMs: latency });
      }
    } else if (playerState === "PLAYING") {
      videoRef.current?.pause();
      setPlayerState("PAUSED");
      void sendHeartbeat(currentTime);
    }
  }, [
    currentTime,
    emitQoeEvent,
    playerState,
    requestPlaybackAuthorization,
    sendHeartbeat,
    sessionData,
  ]);

  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      if (!sessionData) return;
      const next = Math.min(Math.max(0, currentTime + deltaSeconds), duration);
      setCurrentTime(next);
      if (videoRef.current) {
        videoRef.current.currentTime = next;
      }
      void sendHeartbeat(next, deltaSeconds < 0);
    },
    [currentTime, duration, sendHeartbeat, sessionData],
  );

  const adjustVolume = useCallback((delta: number) => {
    setVolume((prev) => {
      const next = Math.min(100, Math.max(0, prev + delta));
      if (videoRef.current) {
        videoRef.current.volume = next / 100;
      }
      return next;
    });
    setMuted(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void containerRef.current.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Periodic 20s heartbeat & logical clock tick while PLAYING
  useEffect(() => {
    if (playerState !== "PLAYING") return;

    const tick = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 1 >= duration) {
          setPlayerState("ENDED");
          void emitQoeEvent("ENDED");
          return duration;
        }
        return prev + 1;
      });
    }, 1000);

    const hb = window.setInterval(() => {
      void sendHeartbeat(currentTime);
    }, 20_000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(hb);
    };
  }, [currentTime, duration, emitQoeEvent, playerState, sendHeartbeat]);

  // Keyboard Shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(e.shiftKey ? -30 : -5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(e.shiftKey ? 30 : 5);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(5);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-5);
          break;
        case "m":
        case "M":
          e.preventDefault();
          setMuted((m) => !m);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
        case "C":
          e.preventDefault();
          setCaptionsEnabled((c) => !c);
          break;
        case "Escape":
          if (document.fullscreenElement) {
            void document.exitFullscreen().catch(() => {});
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adjustVolume, seekRelative, toggleFullscreen, togglePlayPause]);

  const activeSubtitle = sessionData?.subtitles.find((s) => s.id === selectedSubtitleId) ?? null;

  return (
    <div className="space-y-5">
      <div
        ref={containerRef}
        data-player-state={playerState}
        className="border-border-strong bg-surface-1 relative aspect-video w-full overflow-hidden rounded-lg border"
      >
        <video
          ref={videoRef}
          playsInline
          preload="none"
          muted={muted}
          aria-label={`Video player for ${localizedTitle}`}
          className="h-full w-full object-contain"
          onPlaying={() => {
            if (!firstFrameEmittedRef.current && sessionData) {
              firstFrameEmittedRef.current = true;
              const latency = authStartTimeRef.current ? Date.now() - authStartTimeRef.current : 0;
              void emitQoeEvent("FIRST_FRAME", { startupLatencyMs: latency });
            }
          }}
          onError={() => {
            void emitQoeEvent("PLAYBACK_ERROR", { errorCode: "HTML5_VIDEO_ERROR" });
          }}
          onEnded={() => {
            setPlayerState("ENDED");
            void emitQoeEvent("ENDED");
          }}
        >
          {captionsEnabled && activeSubtitle ? (
            <track
              key={activeSubtitle.id}
              kind="captions"
              src={activeSubtitle.vttUrl}
              srcLang={activeSubtitle.languageCode}
              label={activeSubtitle.label}
              default
            />
          ) : null}
        </video>

        {/* Overlay states: IDLE, AUTHORIZING, ERROR, REVOKED */}
        {playerState === "IDLE" ? (
          <div className="bg-canvas/85 absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Badge tone="info">Server-Authorized Stream</Badge>
            <h2 className="font-display text-text text-xl font-bold sm:text-2xl">
              {localizedTitle}
            </h2>
            <p className="text-text-secondary max-w-md text-xs sm:text-sm">
              Playback verifies territorial rights, active licence window, concurrency limits, and
              DRM policy before issuing a short-lived manifest capability. Audio never auto-plays.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="min-h-12 min-w-44"
              onClick={togglePlayPause}
            >
              Authorize &amp; Load Stream
            </Button>
          </div>
        ) : null}

        {playerState === "AUTHORIZING" || playerState === "PREPARING" ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-canvas/90 absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <Spinner size="lg" className="text-accent" />
            <Badge tone="neutral">Verifying Entitlement &amp; Rights Ledger…</Badge>
            <p className="text-text-secondary text-sm">
              Issuing scoped playback token and checking DRM posture…
            </p>
          </div>
        ) : null}

        {(playerState === "ERROR" || playerState === "REVOKED") && errorInfo ? (
          <div
            role="alert"
            className="bg-canvas/95 absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
          >
            <Badge tone="danger">
              {playerState === "REVOKED" ? "Session Revoked" : errorInfo.category}
            </Badge>
            <h2 className="font-display text-text text-lg font-bold sm:text-xl">
              Playback Unavailable (Fail-Closed Policy)
            </h2>
            <p className="text-text-secondary max-w-lg text-sm">{errorInfo.detail}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={requestPlaybackAuthorization}
              >
                Retry Authorization
              </Button>
              <ButtonLink href={`/movies/${titleSlug}`} variant="outline" size="md">
                Return to Film Details
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {/* Accessible Caption Banner Preview when playing */}
        {sessionData && captionsEnabled && activeSubtitle && playerState === "PLAYING" ? (
          <div
            aria-live="off"
            className="bg-canvas/90 text-text pointer-events-none absolute right-4 bottom-20 left-4 mx-auto max-w-xl rounded-xs px-3 py-1.5 text-center text-sm"
          >
            Captions active: {activeSubtitle.label}
          </div>
        ) : null}

        {/* Bottom Control Bar */}
        {sessionData && playerState !== "ERROR" && playerState !== "REVOKED" ? (
          <div className="border-border bg-canvas-raised/95 absolute right-0 bottom-0 left-0 space-y-2 border-t p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <label htmlFor="player-timeline-slider" className="sr-only">
                Playback timeline position
              </label>
              <input
                id="player-timeline-slider"
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                value={currentTime}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCurrentTime(next);
                  void sendHeartbeat(next, true);
                }}
                className="accent-accent h-3 min-h-11 flex-1 cursor-pointer"
              />
              <span className="text-text-secondary font-mono text-xs">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  aria-label={playerState === "PLAYING" ? "Pause" : "Play"}
                  onClick={togglePlayPause}
                >
                  {playerState === "PLAYING" ? "Pause" : "Play"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Rewind 5 seconds"
                  onClick={() => seekRelative(-5)}
                >
                  -5s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Forward 5 seconds"
                  onClick={() => seekRelative(5)}
                >
                  +5s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={muted ? "Unmute audio" : "Mute audio"}
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted ? "Unmute" : `Vol ${volume}%`}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={captionsEnabled ? "secondary" : "outline"}
                  aria-pressed={captionsEnabled}
                  aria-label="Toggle closed captions (C)"
                  onClick={() => setCaptionsEnabled((c) => !c)}
                >
                  CC {captionsEnabled ? "On" : "Off"}
                </Button>

                <label htmlFor="player-resolution-picker" className="sr-only">
                  Select video quality
                </label>
                <select
                  id="player-resolution-picker"
                  value={selectedResolution}
                  onChange={(e) => {
                    const val = e.target.value as ResolutionTier | "AUTO";
                    setSelectedResolution(val);
                    void sendHeartbeat(currentTime, false, "RENDITION_SWITCH");
                  }}
                  className="border-border bg-surface-2 text-text min-h-11 rounded-sm border px-2.5 py-1 text-xs"
                >
                  <option value="AUTO">Auto (Max {sessionData.maxResolution})</option>
                  {sessionData.renditions.map((r) => (
                    <option key={r.id} value={r.resolution}>
                      {r.resolution} ({r.bitrateKbps} kbps)
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Toggle fullscreen (F)"
                  onClick={toggleFullscreen}
                >
                  Fullscreen
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="cg-surface flex flex-col justify-between gap-3 p-4 text-xs sm:flex-row sm:items-center">
        <p className="text-text-muted">
          <strong className="text-text-secondary">Keyboard shortcuts:</strong>{" "}
          <span className="font-mono">Space/K</span> Play/Pause ·{" "}
          <span className="font-mono">←/→</span> Seek 5s (<span className="font-mono">Shift</span>{" "}
          30s) · <span className="font-mono">↑/↓</span> Volume ·{" "}
          <span className="font-mono">M</span> Mute · <span className="font-mono">C</span> Captions
          · <span className="font-mono">F</span> Fullscreen
        </p>
        <p className="text-text-muted">
          Signed URLs enforce short-lived access control, not DRM. Protected contracts fail closed
          without a licensed CDM adapter.
        </p>
      </div>
    </div>
  );
}
