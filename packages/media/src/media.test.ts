// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ABR_LADDER_PROFILES,
  assertSafeLocalProbePath,
  calculateDeliveryCapacityModel,
  calculateFileSizeFromBitrate,
  filterRenditionsByMaxResolution,
  MediaProbeError,
  probeMediaHeaderBytes,
  validateHlsMasterManifest,
} from "./index.ts";

describe("@movie/media — quarantine signature probing, SSRF guards, and ABR ladder policy", () => {
  it("recognizes valid ISO-BMFF MP4/CMAF, WebM EBML, and WebVTT headers", () => {
    const mp4Bytes = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02,
      0x00,
    ]);
    const mp4Result = probeMediaHeaderBytes(mp4Bytes);
    expect(mp4Result.containerFormat).toBe("mp4");
    expect(mp4Result.brandOrProfile).toBe("isom");

    const webmBytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]);
    expect(probeMediaHeaderBytes(webmBytes).containerFormat).toBe("webm");

    const vttBytes = Buffer.from("WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nAuthorized caption\n");
    expect(probeMediaHeaderBytes(vttBytes).containerFormat).toBe("vtt");
  });

  it("blocks PE executables, ELF binaries, shell scripts, and HTML/XSS polyglots in quarantine", () => {
    const peExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(() => probeMediaHeaderBytes(peExe)).toThrowError(MediaProbeError);

    const elfBin = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    expect(() => probeMediaHeaderBytes(elfBin)).toThrowError(/Executable binary/);

    const htmlPolyglot = Buffer.from("<!DOCTYPE html><script>alert(1)</script>");
    expect(() => probeMediaHeaderBytes(htmlPolyglot)).toThrowError(/Active markup payload/);
  });

  it("rejects remote URLs, FFmpeg concat/subfile protocols, option injection, and shell metacharacters", () => {
    expect(() => assertSafeLocalProbePath("https://evil.example/stream.m3u8")).toThrowError(
      /SSRF defense/,
    );
    expect(() => assertSafeLocalProbePath("concat:file1.mp4|file2.mp4")).toThrowError(
      /SSRF defense/,
    );
    expect(() => assertSafeLocalProbePath("-protocol_whitelist")).toThrowError(/option dash/);
    expect(() => assertSafeLocalProbePath("video.mp4; rm -rf /")).toThrowError(/metacharacters/);
  });

  it("validates relative CMAF HLS master manifests and rejects external or traversal URIs", () => {
    const cleanManifest = [
      "#EXTM3U",
      "#EXT-X-VERSION:6",
      "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360",
      "cmaf-360p/index.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720",
      "cmaf-720p/index.m3u8",
    ].join("\n");

    const validated = validateHlsMasterManifest(cleanManifest);
    expect(validated.valid).toBe(true);
    expect(validated.variants).toHaveLength(2);

    const externalVariantManifest = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360",
      "https://pirate-cdn.invalid/hijack.m3u8",
    ].join("\n");
    expect(() => validateHlsMasterManifest(externalVariantManifest)).toThrowError(
      /without external URLs/,
    );

    const traversalManifest = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360",
      "../../quarantine/source.bin",
    ].join("\n");
    expect(() => validateHlsMasterManifest(traversalManifest)).toThrowError(/traversal/);
  });

  it("caps ABR renditions strictly at the rights grant maxResolution", () => {
    const allowed720 = filterRenditionsByMaxResolution(ABR_LADDER_PROFILES, "720p");
    expect(allowed720.map((p) => p.resolution)).toEqual(["360p", "480p", "720p"]);
    expect(allowed720.some((p) => p.resolution === "1080p" || p.resolution === "2160p")).toBe(
      false,
    );
  });

  describe("V4 Delivery Capacity and Bitrate Math (Blueprint §87–88)", () => {
    it("calculates delivery capacity model and detects VPS port ceiling violation", () => {
      // 100 viewers @ 4 Mbps on 1 Gbps (1000 Mbps) VPS port
      const pilot = calculateDeliveryCapacityModel({
        concurrentViewers: 100,
        averageBitrateMbps: 4,
        sessionDurationSeconds: 7200,
        vpsPortSpeedMbps: 1000,
      });
      expect(pilot.aggregateEgressMbps).toBe(400);
      expect(pilot.dataPerSessionMb).toBe(3600);
      expect(pilot.dataPerSessionGb).toBe(3.6);
      expect(pilot.totalVolumeGbForConcurrentSessions).toBe(360);
      expect(pilot.totalVolumeTbForConcurrentSessions).toBe(0.36);
      expect(pilot.isExceedingVpsPort).toBe(false);
      expect(pilot.architecturalGuidance).toContain("Application VPS suitable for control-plane");

      // 500 viewers @ 4 Mbps -> 2000 Mbps aggregate egress (exceeds 1000 Mbps port)
      const overloaded = calculateDeliveryCapacityModel({
        concurrentViewers: 500,
        averageBitrateMbps: 4,
        vpsPortSpeedMbps: 1000,
      });
      expect(overloaded.aggregateEgressMbps).toBe(2000);
      expect(overloaded.isExceedingVpsPort).toBe(true);
      expect(overloaded.architecturalGuidance).toContain(
        "CRITICAL: Aggregate streaming bandwidth exceeds application VPS port ceiling",
      );

      // 0 viewers edge case
      const empty = calculateDeliveryCapacityModel({
        concurrentViewers: 0,
        averageBitrateMbps: 5,
      });
      expect(empty.aggregateEgressMbps).toBe(0);
      expect(empty.totalVolumeGbForConcurrentSessions).toBe(0);
      expect(empty.isExceedingVpsPort).toBe(false);

      // Negative values reject
      expect(() =>
        calculateDeliveryCapacityModel({
          concurrentViewers: -1,
          averageBitrateMbps: 5,
        }),
      ).toThrow(/non-negative/);
    });

    it("calculates empirical file size from bitrate and duration", () => {
      // 2-hour asset @ 5 Mbps total bitrate (5,000,000 bps)
      const res = calculateFileSizeFromBitrate(5_000_000, 7200);
      // 5,000,000 * 7,200 / 8 = 4,500,000,000 bytes = 4.5 GB decimal
      expect(res.bytes).toBe(4_500_000_000);
      expect(res.megabytes).toBe(4500);
      expect(res.gigabytes).toBe(4.5);

      // 800 MB file for 2 hours implies ~ 0.888 Mbps (888,888 bps)
      const smallRes = calculateFileSizeFromBitrate(888_888, 7200);
      expect(smallRes.megabytes).toBeCloseTo(800, 0);

      expect(() => calculateFileSizeFromBitrate(-100, 100)).toThrow(/non-negative/);
    });
  });
});
