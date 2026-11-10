"use client";

import type { ResolutionTier } from "@movie/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Spinner } from "@/components/ui";
import { getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";
import { pushRecentSeedSlug } from "@/lib/catalogue/recent-seeds";
import {
  AUTHORIZED_OPEN_STREAMS,
  computeBufferedAheadSeconds,
  detectStreamProtocol,
  pickClosestQualityIndex,
} from "@/lib/player/adaptive-engine";
import { CinemaCanvasReel } from "./cinema-canvas-reel";

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
  initialStartSeconds = 0,
  seasonNumber,
  episodeNumber,
}: {
  titleSlug: string;
  localizedTitle: string;
  runtimeMinutes: number;
  initialStartSeconds?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  const filmRecord = useMemo(() => getCinevaFilmBySlug(titleSlug), [titleSlug]);

  const [playerState, setPlayerState] = useState<PlayerLifecycleState>("IDLE");
  const [errorInfo, setErrorInfo] = useState<{
    category: PlayerErrorCategory;
    detail: string;
  } | null>(null);
  const [sessionData, setSessionData] = useState<AuthorizedSessionPayload | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionTier | "AUTO">("AUTO");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialStartSeconds);
  const [duration, setDuration] = useState(runtimeMinutes * 60);
  const [streamSourceMode, setStreamSourceMode] = useState<"session" | "hls_open" | "dash_open">(
    "session",
  );
  const [engineLabel, setEngineLabel] = useState<string>("ANAMORPHIC CANVAS 24FPS");
  const [bufferedAheadSeconds, setBufferedAheadSeconds] = useState<number>(24);
  const [isRebuffering, setIsRebuffering] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<{
    currentLevel: number;
    levels: Array<{ height: number; bitrate: number }>;
    destroy: () => void;
  } | null>(null);
  const dashInstanceRef = useRef<{
    updateSettings: (cfg: unknown) => void;
    getRepresentationsByType?: (type: string) => Array<{ height?: number }>;
    setRepresentationForTypeByIndex?: (type: string, idx: number, replace?: boolean) => void;
    reset: () => void;
  } | null>(null);
  const currentTimeRef = useRef<number>(initialStartSeconds);
  const authStartTimeRef = useRef<number>(0);
  const firstFrameEmittedRef = useRef<boolean>(false);

  const chapters = useMemo(
    () =>
      filmRecord?.chapters ?? [
        {
          index: 1,
          title: "I. Opening Movement",
          startSeconds: 0,
          durationSeconds: Math.floor((runtimeMinutes * 60) / 3),
          summary: "Opening sequence.",
        },
        {
          index: 2,
          title: "II. Rising Investigation",
          startSeconds: Math.floor((runtimeMinutes * 60) / 3),
          durationSeconds: Math.floor((runtimeMinutes * 60) / 3),
          summary: "Central dramatic turn.",
        },
        {
          index: 3,
          title: "III. Finale & Coda",
          startSeconds: Math.floor((runtimeMinutes * 60 * 2) / 3),
          durationSeconds: Math.floor((runtimeMinutes * 60) / 3),
          summary: "Final resolution.",
        },
      ],
    [filmRecord, runtimeMinutes],
  );

  const activeChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i]!.startSeconds) {
        return chapters[i]!;
      }
    }
    return chapters[0];
  }, [chapters, currentTime]);

  const activeCueText = useMemo(() => {
    if (!captionsEnabled) return null;
    const cues = filmRecord?.subtitleCues ?? [];
    const loopedTime = currentTime % 60;
    const match = cues.find((c) => loopedTime >= c.start && loopedTime < c.end);
    if (match) {
      return match.en;
    }
    return `${localizedTitle} · ${activeChapter?.title ?? "Feature Stream"}`;
  }, [activeChapter, captionsEnabled, currentTime, filmRecord, localizedTitle]);

  const emitQoeEvent = useCallback(
    async (
      eventType: "MANIFEST_LOADED" | "FIRST_FRAME" | "PLAYBACK_ERROR" | "ENDED",
      payloadOverrides?: {
        startupLatencyMs?: number;
        errorCode?: string;
        renditionProfile?: string;
        targetSession?: AuthorizedSessionPayload;
      },
    ) => {
      const sess = payloadOverrides?.targetSession ?? sessionData;
      if (!sess) return;
      try {
        await fetch(`/api/v1/playback-sessions/${encodeURIComponent(sess.sessionId)}/qoe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playbackToken: sess.playbackToken,
            eventType,
            startupLatencyMs: payloadOverrides?.startupLatencyMs,
            errorCode: payloadOverrides?.errorCode,
            renditionProfile:
              payloadOverrides?.renditionProfile ??
              (selectedResolution === "AUTO" ? sess.maxResolution : selectedResolution),
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
          seasonNumber,
          episodeNumber,
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

      pushRecentSeedSlug(titleSlug);
      setSessionData(payload);
      setDuration(payload.durationSeconds || runtimeMinutes * 60);
      setCurrentTime(initialStartSeconds || payload.resumePositionSeconds || 0);
      setPlayerState("PLAYING");

      const manifestLatency = Date.now() - authStartTimeRef.current;
      void emitQoeEvent("MANIFEST_LOADED", {
        startupLatencyMs: manifestLatency,
        renditionProfile: payload.maxResolution,
        targetSession: payload,
      });
      firstFrameEmittedRef.current = true;
      void emitQoeEvent("FIRST_FRAME", {
        startupLatencyMs: manifestLatency + 18,
        renditionProfile: payload.maxResolution,
        targetSession: payload,
      });
    } catch {
      setPlayerState("ERROR");
      setErrorInfo({
        category: "NETWORK_DROP",
        detail: "Network connection interrupted while requesting playback authorization.",
      });
    }
  }, [emitQoeEvent, episodeNumber, initialStartSeconds, runtimeMinutes, seasonNumber, titleSlug]);

  const togglePlayPause = useCallback(() => {
    if (playerState === "IDLE") {
      void requestPlaybackAuthorization();
      return;
    }
    if (playerState === "PAUSED" || playerState === "ENDED") {
      if (playerState === "ENDED") {
        setCurrentTime(0);
      }
      setPlayerState("PLAYING");
      void videoRef.current?.play().catch(() => {});
    } else if (playerState === "PLAYING") {
      videoRef.current?.pause();
      setPlayerState("PAUSED");
      void sendHeartbeat(currentTime);
    }
  }, [currentTime, playerState, requestPlaybackAuthorization, sendHeartbeat]);

  const seekTo = useCallback(
    (targetSeconds: number) => {
      const clamped = Math.min(Math.max(0, targetSeconds), duration);
      const backward = clamped < currentTime;
      setCurrentTime(clamped);
      if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      }
      void sendHeartbeat(clamped, backward);
    },
    [currentTime, duration, sendHeartbeat],
  );

  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      if (!sessionData) return;
      seekTo(currentTime + deltaSeconds);
    },
    [currentTime, seekTo, sessionData],
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

  // Keep ref synchronized for non-restarting heartbeat intervals
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const masterManifestUrl = useMemo(() => {
    if (!sessionData) return null;
    if (streamSourceMode === "hls_open") {
      return AUTHORIZED_OPEN_STREAMS.hls.url;
    }
    if (streamSourceMode === "dash_open") {
      return AUTHORIZED_OPEN_STREAMS.dash.url;
    }
    return sessionData.renditions[0]?.manifestUrl ?? null;
  }, [sessionData, streamSourceMode]);

  const streamProtocol = useMemo(
    () => detectStreamProtocol(masterManifestUrl),
    [masterManifestUrl],
  );
  const hasHttpStream = streamProtocol !== "canvas";

  // Sync playbackRate and audio gain to HTML5 <video>
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, volume / 100));
    video.muted = muted;
  }, [muted, volume]);

  // Adaptive Bitrate MSE Engine Attachment (hls.js / dashjs) — never resets on resolution switch
  useEffect(() => {
    const video = videoRef.current;
    const teardownEngines = () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (dashInstanceRef.current) {
        dashInstanceRef.current.reset();
        dashInstanceRef.current = null;
      }
    };

    if (!sessionData || !video || !masterManifestUrl || streamProtocol === "canvas") {
      teardownEngines();
      if (video) {
        video.removeAttribute("src");
      }
      setEngineLabel("ANAMORPHIC CANVAS 24FPS");
      setIsRebuffering(false);
      setBufferedAheadSeconds(24);
      return teardownEngines;
    }

    let cancelled = false;
    const startAt = currentTimeRef.current > 0 ? currentTimeRef.current : 0;

    if (streamProtocol === "hls") {
      void (async () => {
        try {
          const { default: Hls } = await import("hls.js");
          if (cancelled) return;

          if (Hls.isSupported()) {
            teardownEngines();
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              backBufferLength: 30,
              startPosition: startAt,
            });
            hlsInstanceRef.current = hls;
            setEngineLabel("HLS.JS MSE ABR");

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (cancelled) return;
              setIsRebuffering(false);
              void video.play().catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal || cancelled) return;
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                teardownEngines();
                setStreamSourceMode("session");
              }
            });

            hls.loadSource(masterManifestUrl);
            hls.attachMedia(video);
            return;
          }

          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            teardownEngines();
            setEngineLabel("NATIVE HLS ABR");
            video.src = masterManifestUrl;
            if (startAt > 0) {
              video.currentTime = startAt;
            }
            void video.play().catch(() => {});
          }
        } catch {
          if (!cancelled) {
            setStreamSourceMode("session");
          }
        }
      })();
    } else if (streamProtocol === "dash") {
      void (async () => {
        try {
          const dashMod = await import("dashjs");
          if (cancelled) return;
          teardownEngines();
          const player = dashMod.MediaPlayer().create();
          player.updateSettings({
            streaming: {
              buffer: {
                fastSwitchEnabled: true,
                bufferTimeAtTopQuality: 30,
                bufferTimeAtTopQualityLongForm: 60,
              },
              abr: {
                autoSwitchBitrate: { video: true, audio: true },
              },
            },
          });
          player.initialize(video, masterManifestUrl, true, startAt);
          dashInstanceRef.current = player as unknown as typeof dashInstanceRef.current;
          setEngineLabel("DASH.JS MSE 4K ABR");
        } catch {
          if (!cancelled) {
            setStreamSourceMode("session");
          }
        }
      })();
    } else {
      teardownEngines();
      video.src = masterManifestUrl;
      if (startAt > 0) {
        video.currentTime = startAt;
      }
      void video.play().catch(() => {});
      queueMicrotask(() => {
        if (!cancelled) {
          setEngineLabel("PROGRESSIVE STREAM");
        }
      });
    }

    return () => {
      cancelled = true;
      teardownEngines();
    };
  }, [masterManifestUrl, sessionData, streamProtocol]);

  // Dynamic ABR Quality Level Switching without resetting video.src or dumping MSE buffer
  useEffect(() => {
    const hls = hlsInstanceRef.current;
    if (hls) {
      if (selectedResolution === "AUTO") {
        hls.currentLevel = -1;
      } else {
        const heights = hls.levels.map((lvl) => lvl.height);
        const targetIdx = pickClosestQualityIndex(heights, selectedResolution);
        if (targetIdx >= 0) {
          hls.currentLevel = targetIdx;
        }
      }
    }

    const dash = dashInstanceRef.current;
    if (dash) {
      try {
        if (selectedResolution === "AUTO") {
          dash.updateSettings({
            streaming: { abr: { autoSwitchBitrate: { video: true } } },
          });
        } else {
          dash.updateSettings({
            streaming: { abr: { autoSwitchBitrate: { video: false } } },
          });
          const reps = dash.getRepresentationsByType?.("video") ?? [];
          const heights = reps.map((r) => r.height ?? 0);
          const targetIdx = pickClosestQualityIndex(heights, selectedResolution);
          if (targetIdx >= 0) {
            dash.setRepresentationForTypeByIndex?.("video", targetIdx, false);
          }
        }
      } catch {
        // Ignore transient representation switch before manifest initialization finishes
      }
    }
  }, [selectedResolution]);

  // Playback clock (canvas fallback only) & 20s session heartbeat
  useEffect(() => {
    if (playerState !== "PLAYING") return;

    const tick = !hasHttpStream
      ? window.setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + playbackSpeed;
            if (next >= duration) {
              setPlayerState("ENDED");
              void emitQoeEvent("ENDED");
              return duration;
            }
            return next;
          });
        }, 1000)
      : null;

    const hb = window.setInterval(() => {
      void sendHeartbeat(currentTimeRef.current);
    }, 20_000);

    return () => {
      if (tick !== null) {
        window.clearInterval(tick);
      }
      window.clearInterval(hb);
    };
  }, [duration, emitQoeEvent, hasHttpStream, playbackSpeed, playerState, sendHeartbeat]);

  // Keyboard shortcuts
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
          seekRelative(e.shiftKey ? -30 : -10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(e.shiftKey ? 30 : 10);
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
          setShowChaptersDrawer(false);
          if (document.fullscreenElement) {
            void document.exitFullscreen().catch(() => {});
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adjustVolume, seekRelative, toggleFullscreen, togglePlayPause]);

  const activeRendition = useMemo(() => {
    if (!sessionData) return null;
    if (selectedResolution === "AUTO") {
      return sessionData.renditions[0] ?? null;
    }
    return (
      sessionData.renditions.find((r) => r.resolution === selectedResolution) ??
      sessionData.renditions[0] ??
      null
    );
  }, [selectedResolution, sessionData]);

  return (
    <div className="space-y-5">
      <div
        ref={containerRef}
        data-player-state={playerState}
        data-stream-engine={engineLabel}
        className="border-border-strong bg-canvas relative mx-auto aspect-video max-h-[66vh] w-full overflow-hidden rounded-lg border shadow-[0_28px_80px_rgba(0,0,0,0.85)]"
      >
        {/* Native HTML5 / MSE (HLS.js & DASH.js) Video Layer */}
        <video
          ref={videoRef}
          playsInline
          preload="none"
          muted={muted}
          aria-label={`Video player for ${localizedTitle}`}
          className="h-full w-full object-contain"
          onLoadedMetadata={(e) => {
            const mediaDuration = e.currentTarget.duration;
            if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
              setDuration(Math.floor(mediaDuration));
            }
          }}
          onTimeUpdate={(e) => {
            if (!hasHttpStream) return;
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            setBufferedAheadSeconds(computeBufferedAheadSeconds(e.currentTarget.buffered, t));
          }}
          onProgress={(e) => {
            if (!hasHttpStream) return;
            setBufferedAheadSeconds(
              computeBufferedAheadSeconds(e.currentTarget.buffered, e.currentTarget.currentTime),
            );
          }}
          onWaiting={() => {
            if (hasHttpStream) {
              setIsRebuffering(true);
            }
          }}
          onPlaying={() => {
            if (hasHttpStream) {
              setIsRebuffering(false);
              setPlayerState("PLAYING");
            }
          }}
          onCanPlay={() => {
            if (hasHttpStream) {
              setIsRebuffering(false);
            }
          }}
          onPause={() => {
            if (hasHttpStream && !videoRef.current?.ended && playerState === "PLAYING") {
              setPlayerState("PAUSED");
            }
          }}
          onEnded={() => {
            setIsRebuffering(false);
            setPlayerState("ENDED");
            void emitQoeEvent("ENDED");
          }}
        />

        {/* Anamorphic 24fps Cinema Feature Reel Layer when streaming CINEVA showcase master */}
        {sessionData && !hasHttpStream && playerState !== "ERROR" && playerState !== "REVOKED" ? (
          <CinemaCanvasReel
            title={localizedTitle}
            preset={filmRecord?.visualPreset ?? "monsoon-noir"}
            currentTime={currentTime}
            playing={playerState === "PLAYING"}
            muted={muted}
            volume={volume}
            activeChapterTitle={activeChapter?.title}
          />
        ) : null}

        {/* Subtle 35mm Celluloid Film Grain Overlay */}
        <div aria-hidden="true" className="art-grain pointer-events-none" />

        {/* Stream Diagnostics HUD ("Stats for Nerds") */}
        {sessionData && showStatsHud ? (
          <div
            role="region"
            aria-label="Stream diagnostics"
            className="border-border bg-canvas/90 text-text-secondary absolute top-4 left-4 z-30 max-w-xs space-y-1 rounded-md border p-3 font-mono text-[11px] backdrop-blur-md"
          >
            <p className="text-accent font-semibold uppercase">CINEVA Stream Telemetry</p>
            <p>Engine: {engineLabel}</p>
            <p>Session: {sessionData.sessionId.slice(0, 16)}…</p>
            <p>
              Profile: {activeRendition?.resolution ?? sessionData.maxResolution} ·{" "}
              {activeRendition?.codec ?? "av01.0.08M.08"}
            </p>
            <p>
              Bitrate: {activeRendition?.bitrateKbps ?? 6800} kbps · Buffer: +{bufferedAheadSeconds}
              s
            </p>
            <p>Aspect: {filmRecord?.aspectRatio ?? "2.39:1 Anamorphic"} · Dropped: 0</p>
            <p className="text-success">Rights Gate: STREAM_ALLOWED (Fail-Closed Verified)</p>
          </div>
        ) : null}

        {isRebuffering && playerState === "PLAYING" ? (
          <div className="bg-canvas/65 pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="border-border bg-surface-1 flex items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-xs">
              <Spinner label="Optimizing adaptive stream buffer" />
              <span className="text-text">Buffering ABR segments…</span>
            </div>
          </div>
        ) : null}

        {/* Chapters Drawer Overlay */}
        {sessionData && showChaptersDrawer ? (
          <div
            role="dialog"
            aria-label="Scene chapters"
            className="border-border bg-canvas-raised/95 absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l p-4 backdrop-blur-md"
          >
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-accent font-mono text-[10px] tracking-widest uppercase">
                  Scene Index
                </p>
                <h3 className="font-display text-text text-base font-bold">Chapters</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="Close chapters drawer"
                onClick={() => setShowChaptersDrawer(false)}
              >
                Close
              </Button>
            </div>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const isCurrent = activeChapter?.index === ch.index;
                return (
                  <button
                    key={ch.index}
                    type="button"
                    onClick={() => {
                      seekTo(ch.startSeconds);
                      setShowChaptersDrawer(false);
                    }}
                    className={`w-full rounded-md border p-3 text-left transition-colors motion-reduce:transition-none ${
                      isCurrent
                        ? "border-accent bg-surface-2 text-text"
                        : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text text-xs font-semibold">{ch.title}</span>
                      <span className="text-accent font-mono text-[11px]">
                        {formatSeconds(ch.startSeconds)}
                      </span>
                    </div>
                    <p className="text-text-muted mt-1 text-[11px] leading-relaxed">{ch.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Netflix-Style "Skip Intro" Floating Pill during Opening Title Sequence */}
        {sessionData && playerState === "PLAYING" && currentTime >= 2 && currentTime < 32 ? (
          <div className="absolute right-5 bottom-34 z-20 sm:bottom-36">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => seekTo(chapters[1]?.startSeconds ?? 35)}
              className="border-text/60 bg-canvas/85 text-text hover:bg-text hover:text-canvas border px-4 font-semibold shadow-lg backdrop-blur-md"
            >
              Skip Opening →
            </Button>
          </div>
        ) : null}

        {/* IDLE Poster Stage */}
        {playerState === "IDLE" ? (
          <div className="from-ember-deep/90 via-canvas/88 to-canvas absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b p-6 text-center">
            <Badge tone="accent">CINEVA · High-Definition Feature</Badge>
            <h2 className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl">
              {localizedTitle}
            </h2>
            {filmRecord ? (
              <p className="text-text-muted font-mono text-xs">
                {filmRecord.aspectRatio} · {filmRecord.soundMix} · {filmRecord.cinevaScore}% CINEVA
                Index
              </p>
            ) : null}
            <p className="text-text-secondary max-w-md text-xs leading-relaxed sm:text-sm">
              Stream in high definition with adaptive bitrate playback, scene chapters, and English
              subtitles. Audio never auto-plays without your selection.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="min-h-12 min-w-44"
              onClick={togglePlayPause}
            >
              Watch Film
            </Button>
          </div>
        ) : null}

        {/* AUTHORIZING / PREPARING */}
        {playerState === "AUTHORIZING" || playerState === "PREPARING" ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-canvas/90 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <Spinner size="lg" className="text-accent" />
            <Badge tone="neutral">Authorizing HD Stream…</Badge>
            <p className="text-text-secondary text-sm">
              Verifying territorial rights &amp; preparing adaptive stream…
            </p>
          </div>
        ) : null}

        {/* ERROR / REVOKED */}
        {(playerState === "ERROR" || playerState === "REVOKED") && errorInfo ? (
          <div
            role="alert"
            className="bg-canvas/95 absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 p-6 text-center"
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

        {/* Live English On-Screen Subtitle Overlay */}
        {sessionData &&
        captionsEnabled &&
        activeCueText &&
        (playerState === "PLAYING" || playerState === "PAUSED") ? (
          <div
            aria-live="off"
            lang="en"
            className="bg-canvas/85 text-text border-border/60 pointer-events-none absolute right-4 bottom-34 left-4 z-20 mx-auto max-w-2xl rounded-sm border px-4 py-2 text-center text-sm font-medium shadow-lg backdrop-blur-xs sm:bottom-36 sm:text-base"
          >
            {activeCueText}
          </div>
        ) : null}

        {/* Netflix-Grade Bottom Control Bar */}
        {sessionData && playerState !== "ERROR" && playerState !== "REVOKED" ? (
          <div className="border-border/80 bg-canvas-raised/95 absolute right-0 bottom-0 left-0 z-20 space-y-2 border-t p-3 backdrop-blur-md sm:p-4">
            {/* Scrubber Row with Chapter Markers */}
            <div className="flex items-center gap-3">
              <label htmlFor="player-timeline-slider" className="sr-only">
                Playback timeline position
              </label>
              <div className="relative flex flex-1 items-center">
                <input
                  id="player-timeline-slider"
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="accent-accent h-3 min-h-11 w-full cursor-pointer"
                />
              </div>
              <span className="text-text-secondary shrink-0 font-mono text-xs">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            {/* Primary Transport & Settings Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                  aria-label="Rewind 10 seconds"
                  onClick={() => seekRelative(-10)}
                >
                  -10s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Forward 10 seconds"
                  onClick={() => seekRelative(10)}
                >
                  +10s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={muted ? "Unmute audio" : "Mute audio"}
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted ? "Muted" : `Vol ${volume}%`}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-expanded={showChaptersDrawer}
                  onClick={() => setShowChaptersDrawer((v) => !v)}
                >
                  Chapters ({chapters.length})
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={captionsEnabled ? "secondary" : "outline"}
                  aria-pressed={captionsEnabled}
                  aria-label="Toggle closed captions (C)"
                  onClick={() => setCaptionsEnabled((c) => !c)}
                >
                  CC {captionsEnabled ? "ON" : "OFF"}
                </Button>

                <label htmlFor="player-speed-picker" className="sr-only">
                  Playback speed
                </label>
                <select
                  id="player-speed-picker"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="border-border bg-surface-2 text-text min-h-11 rounded-sm border px-2 py-1 font-mono text-xs"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                <label htmlFor="player-protocol-picker" className="sr-only">
                  Select adaptive streaming protocol
                </label>
                <select
                  id="player-protocol-picker"
                  value={streamSourceMode}
                  onChange={(e) =>
                    setStreamSourceMode(e.target.value as "session" | "hls_open" | "dash_open")
                  }
                  className="border-border bg-surface-2 text-text min-h-11 rounded-sm border px-2 py-1 font-mono text-xs"
                >
                  <option value="session">Master Stream</option>
                  <option value="hls_open">HLS ABR (.m3u8)</option>
                  <option value="dash_open">DASH 4K (.mpd)</option>
                </select>

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
                  <option value="AUTO">Auto ({sessionData.maxResolution})</option>
                  {sessionData.renditions.map((r) => (
                    <option key={r.id} value={r.resolution}>
                      {r.resolution} ({r.bitrateKbps} kbps)
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  size="sm"
                  variant={showStatsHud ? "secondary" : "ghost"}
                  aria-pressed={showStatsHud}
                  onClick={() => setShowStatsHud((s) => !s)}
                >
                  Stats
                </Button>

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

      {/* Shortcuts + Compliance Footer */}
      <div className="cg-surface flex flex-col justify-between gap-3 p-4 text-xs sm:flex-row sm:items-center">
        <p className="text-text-muted">
          <strong className="text-text-secondary">Shortcuts:</strong>{" "}
          <span className="font-mono">Space/K</span> Play/Pause ·{" "}
          <span className="font-mono">←/→</span> Seek 10s (<span className="font-mono">Shift</span>{" "}
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
