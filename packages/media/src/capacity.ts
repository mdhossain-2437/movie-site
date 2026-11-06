/**
 * V4 Network, Capacity, and Bitrate Math (Blueprint §87.1–87.4, §88.2).
 * Formulates concurrent viewer streaming bandwidth, session data volume,
 * file-size bitrate relationships, and control-plane VPS vs. CDN separation guardrails.
 */

export interface DeliveryCapacityModelInput {
  concurrentViewers: number;
  averageBitrateMbps: number;
  sessionDurationSeconds?: number; // default 7,200s (2 hours)
  vpsPortSpeedMbps?: number; // default 1,000 Mbps (1 Gbps)
}

export interface DeliveryCapacityModelResult {
  aggregateEgressMbps: number;
  dataPerSessionMb: number;
  dataPerSessionGb: number;
  totalVolumeGbForConcurrentSessions: number;
  totalVolumeTbForConcurrentSessions: number;
  vpsPortCeilingMbps: number;
  isExceedingVpsPort: boolean;
  architecturalGuidance: string;
}

/**
 * Calculates delivery capacity requirements for concurrent viewers and verifies
 * whether the required egress exceeds an application VPS port ceiling.
 */
export function calculateDeliveryCapacityModel(
  input: DeliveryCapacityModelInput,
): DeliveryCapacityModelResult {
  if (input.concurrentViewers < 0 || input.averageBitrateMbps < 0) {
    throw new Error("concurrentViewers and averageBitrateMbps must be non-negative");
  }
  const durationSeconds = input.sessionDurationSeconds ?? 7200;
  const vpsPortCeilingMbps = input.vpsPortSpeedMbps ?? 1000;

  const aggregateEgressMbps = input.concurrentViewers * input.averageBitrateMbps;
  const dataPerSessionMb = (input.averageBitrateMbps * durationSeconds) / 8;
  const dataPerSessionGb = dataPerSessionMb / 1000;
  const totalVolumeGbForConcurrentSessions = input.concurrentViewers * dataPerSessionGb;
  const totalVolumeTbForConcurrentSessions = totalVolumeGbForConcurrentSessions / 1000;
  const isExceedingVpsPort = aggregateEgressMbps > vpsPortCeilingMbps;

  const architecturalGuidance = isExceedingVpsPort
    ? "CRITICAL: Aggregate streaming bandwidth exceeds application VPS port ceiling. Control plane VPS must not serve media segments directly; delivery must route through CDN/origin shield."
    : "Application VPS suitable for control-plane orchestration. Media segments should still be offloaded to CDN for regional edge caching.";

  return {
    aggregateEgressMbps,
    dataPerSessionMb: Number(dataPerSessionMb.toFixed(2)),
    dataPerSessionGb: Number(dataPerSessionGb.toFixed(3)),
    totalVolumeGbForConcurrentSessions: Number(totalVolumeGbForConcurrentSessions.toFixed(2)),
    totalVolumeTbForConcurrentSessions: Number(totalVolumeTbForConcurrentSessions.toFixed(3)),
    vpsPortCeilingMbps,
    isExceedingVpsPort,
    architecturalGuidance,
  };
}

/**
 * Calculates empirical file size from average total bitrate (video + audio) and duration.
 * Formula: Size (bytes) ≈ bitrate (bits/s) × duration (seconds) ÷ 8
 */
export function calculateFileSizeFromBitrate(
  bitrateBps: number,
  durationSeconds: number,
): { bytes: number; megabytes: number; gigabytes: number } {
  if (bitrateBps < 0 || durationSeconds < 0) {
    throw new Error("bitrateBps and durationSeconds must be non-negative");
  }
  const bytes = Math.round((bitrateBps * durationSeconds) / 8);
  return {
    bytes,
    megabytes: Number((bytes / 1_000_000).toFixed(2)),
    gigabytes: Number((bytes / 1_000_000_000).toFixed(3)),
  };
}
