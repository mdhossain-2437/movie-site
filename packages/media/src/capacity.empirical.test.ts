import { describe, expect, it } from "vitest";
import { calculateDeliveryCapacityModel, calculateFileSizeFromBitrate } from "./index.ts";

describe("Empirical Challenger: Capacity & Delivery Math Stress Suite", () => {
  describe("1. Extreme Viewer Values & Port Ceiling Transitions", () => {
    it("handles 0 viewers without NaN or division by zero", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 0,
        averageBitrateMbps: 4.5,
      });

      expect(res.aggregateEgressMbps).toBe(0);
      expect(res.totalVolumeGbForConcurrentSessions).toBe(0);
      expect(res.totalVolumeTbForConcurrentSessions).toBe(0);
      expect(res.isExceedingVpsPort).toBe(false);
      expect(res.dataPerSessionMb).toBe(4050); // (4.5 * 7200) / 8 = 4050
      expect(res.dataPerSessionGb).toBe(4.05);
      expect(Number.isNaN(res.aggregateEgressMbps)).toBe(false);
      expect(Number.isFinite(res.aggregateEgressMbps)).toBe(true);
      expect(res.architecturalGuidance).toContain("Application VPS suitable");
    });

    it("handles large scale (100k viewers) accurately with high egress", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 100_000,
        averageBitrateMbps: 4.5,
        sessionDurationSeconds: 7200,
        vpsPortSpeedMbps: 1000,
      });

      // 100,000 * 4.5 Mbps = 450,000 Mbps (450 Gbps)
      expect(res.aggregateEgressMbps).toBe(450_000);
      // data per session: (4.5 * 7200) / 8 = 4050 Mb = 4.05 Gb
      expect(res.dataPerSessionMb).toBe(4050);
      expect(res.dataPerSessionGb).toBe(4.05);
      // total volume: 100,000 * 4.05 = 405,000 Gb = 405 Tb
      expect(res.totalVolumeGbForConcurrentSessions).toBe(405_000);
      expect(res.totalVolumeTbForConcurrentSessions).toBe(405);
      expect(res.isExceedingVpsPort).toBe(true);
      expect(res.architecturalGuidance).toContain(
        "CRITICAL: Aggregate streaming bandwidth exceeds",
      );
    });

    it("handles mega scale (1M viewers) maintaining finite numeric precision", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 1_000_000,
        averageBitrateMbps: 8,
      });

      expect(res.aggregateEgressMbps).toBe(8_000_000);
      expect(Number.isFinite(res.aggregateEgressMbps)).toBe(true);
      expect(Number.isFinite(res.totalVolumeGbForConcurrentSessions)).toBe(true);
      expect(Number.isFinite(res.totalVolumeTbForConcurrentSessions)).toBe(true);
      expect(res.isExceedingVpsPort).toBe(true);
    });

    it("evaluates boundary condition exactly at port speed ceiling", () => {
      // 200 viewers @ 5 Mbps = 1000 Mbps on 1000 Mbps port -> NOT exceeding (strictly >)
      const exactlyAtCeiling = calculateDeliveryCapacityModel({
        concurrentViewers: 200,
        averageBitrateMbps: 5,
        vpsPortSpeedMbps: 1000,
      });
      expect(exactlyAtCeiling.aggregateEgressMbps).toBe(1000);
      expect(exactlyAtCeiling.isExceedingVpsPort).toBe(false);

      // 201 viewers @ 5 Mbps = 1005 Mbps -> exceeding
      const justOverCeiling = calculateDeliveryCapacityModel({
        concurrentViewers: 201,
        averageBitrateMbps: 5,
        vpsPortSpeedMbps: 1000,
      });
      expect(justOverCeiling.aggregateEgressMbps).toBe(1005);
      expect(justOverCeiling.isExceedingVpsPort).toBe(true);
    });
  });

  describe("2. Fractional Bitrates & Precision Verification", () => {
    it("handles fractional bitrates (e.g. 0.35 Mbps audio / low-res)", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 50,
        averageBitrateMbps: 0.35,
        sessionDurationSeconds: 3600,
      });

      expect(res.aggregateEgressMbps).toBe(17.5);
      // (0.35 * 3600) / 8 = 157.5 Mb
      expect(res.dataPerSessionMb).toBe(157.5);
      // 157.5 / 1000 = 0.1575 -> toFixed(3) = 0.158
      expect(res.dataPerSessionGb).toBe(0.158);
      expect(res.isExceedingVpsPort).toBe(false);
      expect(Number.isNaN(res.dataPerSessionMb)).toBe(false);
      expect(Number.isNaN(res.dataPerSessionGb)).toBe(false);
    });

    it("handles micro bitrates (0.001 Mbps) without underflow", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 10,
        averageBitrateMbps: 0.001,
      });

      expect(res.aggregateEgressMbps).toBe(0.01);
      expect(Number.isFinite(res.aggregateEgressMbps)).toBe(true);
      expect(res.isExceedingVpsPort).toBe(false);
    });

    it("handles 0 Mbps bitrate (quiescent stream)", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 100,
        averageBitrateMbps: 0,
      });

      expect(res.aggregateEgressMbps).toBe(0);
      expect(res.dataPerSessionMb).toBe(0);
      expect(res.dataPerSessionGb).toBe(0);
      expect(res.totalVolumeGbForConcurrentSessions).toBe(0);
      expect(res.isExceedingVpsPort).toBe(false);
    });
  });

  describe("3. Session Duration Edge Cases", () => {
    it("handles 0 duration seconds cleanly", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 500,
        averageBitrateMbps: 4,
        sessionDurationSeconds: 0,
      });

      expect(res.aggregateEgressMbps).toBe(2000);
      expect(res.dataPerSessionMb).toBe(0);
      expect(res.dataPerSessionGb).toBe(0);
      expect(res.totalVolumeGbForConcurrentSessions).toBe(0);
      expect(res.isExceedingVpsPort).toBe(true);
    });

    it("handles 24-hour long marathon session (86,400s)", () => {
      const res = calculateDeliveryCapacityModel({
        concurrentViewers: 10,
        averageBitrateMbps: 5,
        sessionDurationSeconds: 86400,
      });

      // (5 * 86400) / 8 = 54,000 Mb = 54 Gb
      expect(res.dataPerSessionMb).toBe(54000);
      expect(res.dataPerSessionGb).toBe(54);
      expect(res.totalVolumeGbForConcurrentSessions).toBe(540);
      expect(res.totalVolumeTbForConcurrentSessions).toBe(0.54);
    });
  });

  describe("4. Negative & Invalid Input Defense", () => {
    it("rejects negative concurrentViewers", () => {
      expect(() =>
        calculateDeliveryCapacityModel({
          concurrentViewers: -1,
          averageBitrateMbps: 5,
        }),
      ).toThrow(/non-negative/);
    });

    it("rejects negative averageBitrateMbps", () => {
      expect(() =>
        calculateDeliveryCapacityModel({
          concurrentViewers: 100,
          averageBitrateMbps: -0.1,
        }),
      ).toThrow(/non-negative/);
    });
  });

  describe("5. File Size from Bitrate Formula", () => {
    it("calculates exact bytes, megabytes, and gigabytes for standard 2-hour 1080p stream", () => {
      // 4 Mbps = 4,000,000 bps, 7200 seconds
      const res = calculateFileSizeFromBitrate(4_000_000, 7200);
      // bytes = 4,000,000 * 7200 / 8 = 3,600,000,000
      expect(res.bytes).toBe(3_600_000_000);
      expect(res.megabytes).toBe(3600);
      expect(res.gigabytes).toBe(3.6);
    });

    it("calculates exact bytes for 4K 25 Mbps stream", () => {
      // 25 Mbps = 25,000,000 bps, 7200 seconds
      const res = calculateFileSizeFromBitrate(25_000_000, 7200);
      // bytes = 25,000,000 * 7200 / 8 = 22,500,000,000
      expect(res.bytes).toBe(22_500_000_000);
      expect(res.megabytes).toBe(22500);
      expect(res.gigabytes).toBe(22.5);
    });

    it("handles 0 bps and 0 duration", () => {
      expect(calculateFileSizeFromBitrate(0, 7200)).toEqual({
        bytes: 0,
        megabytes: 0,
        gigabytes: 0,
      });
      expect(calculateFileSizeFromBitrate(5_000_000, 0)).toEqual({
        bytes: 0,
        megabytes: 0,
        gigabytes: 0,
      });
    });

    it("rejects negative values for file size calculation", () => {
      expect(() => calculateFileSizeFromBitrate(-1, 7200)).toThrow(/non-negative/);
      expect(() => calculateFileSizeFromBitrate(5_000_000, -1)).toThrow(/non-negative/);
    });
  });

  describe("6. Fuzzing & No-NaN Invariant Check", () => {
    it("ensures no NaN or Infinity across 200 randomized parameter combinations", () => {
      const viewerSamples = [0, 1, 5, 42, 100, 500, 1000, 9999, 50000, 100000];
      const bitrateSamples = [0, 0.1, 0.35, 1.25, 3.75, 4.0, 8.5, 15.0, 50.0];
      const durationSamples = [0, 60, 1800, 3600, 7200, 14400];
      const portSamples = [100, 1000, 2500, 10000];

      for (const viewers of viewerSamples) {
        for (const bitrate of bitrateSamples) {
          for (const duration of durationSamples) {
            for (const port of portSamples) {
              const res = calculateDeliveryCapacityModel({
                concurrentViewers: viewers,
                averageBitrateMbps: bitrate,
                sessionDurationSeconds: duration,
                vpsPortSpeedMbps: port,
              });

              expect(Number.isNaN(res.aggregateEgressMbps)).toBe(false);
              expect(Number.isFinite(res.aggregateEgressMbps)).toBe(true);
              expect(Number.isNaN(res.dataPerSessionMb)).toBe(false);
              expect(Number.isFinite(res.dataPerSessionMb)).toBe(true);
              expect(Number.isNaN(res.dataPerSessionGb)).toBe(false);
              expect(Number.isFinite(res.dataPerSessionGb)).toBe(true);
              expect(Number.isNaN(res.totalVolumeGbForConcurrentSessions)).toBe(false);
              expect(Number.isFinite(res.totalVolumeGbForConcurrentSessions)).toBe(true);
              expect(Number.isNaN(res.totalVolumeTbForConcurrentSessions)).toBe(false);
              expect(Number.isFinite(res.totalVolumeTbForConcurrentSessions)).toBe(true);
              expect(typeof res.isExceedingVpsPort).toBe("boolean");
              expect(typeof res.architecturalGuidance).toBe("string");
            }
          }
        }
      }
    });
  });
});
