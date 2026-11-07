"use client";

import { useState } from "react";
import { KeyArt, type KeyArtVariant } from "@/components/art/key-art";
import type { ArtSpec } from "@/lib/catalogue/types";

export interface TmdbArtworkProps {
  src: string | null;
  alt: string;
  fallbackArt: ArtSpec;
  variant?: KeyArtVariant;
  className?: string;
}

/**
 * Renders same-origin `/api/v1/tmdb/image/...` artwork while keeping strict CSP
 * (`img-src 'self' data: blob:`) and falling back to deterministic `KeyArt` SVG
 * whenever an image is unavailable or offline.
 */
export function TmdbArtwork({
  src,
  alt,
  fallbackArt,
  variant = "poster",
  className = "",
}: TmdbArtworkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSrc);

  if (!showImage || !src) {
    return <KeyArt spec={fallbackArt} variant={variant} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Same-origin validated /api/v1/tmdb/image proxy
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
