import { describe, expect, it } from "vitest";
import {
  AUTHORIZED_OPEN_STREAMS,
  computeBufferedAheadSeconds,
  detectStreamProtocol,
  pickClosestQualityIndex,
  resolutionTierToHeight,
} from "@/lib/player/adaptive-engine";

describe("Milestone 3: Adaptive Bitrate Stream Engine (HLS & DASH)", () => {
  it("detects HLS (.m3u8), MPEG-DASH (.mpd), progressive MP4, and offline showcase URIs accurately", () => {
    expect(detectStreamProtocol(AUTHORIZED_OPEN_STREAMS.hls.url)).toBe("hls");
    expect(detectStreamProtocol("https://cdn.cineva.example/streams/master.m3u8?sig=abc")).toBe(
      "hls",
    );
    expect(detectStreamProtocol(AUTHORIZED_OPEN_STREAMS.dash.url)).toBe("dash");
    expect(detectStreamProtocol("https://cdn.cineva.example/streams/manifest.mpd?token=1")).toBe(
      "dash",
    );
    expect(detectStreamProtocol("https://cdn.cineva.example/feature.mp4")).toBe("mp4");
    expect(detectStreamProtocol("cineva://reel/the-last-monsoon")).toBe("canvas");
    expect(detectStreamProtocol("https://memory-storage.local/pkg/master.m3u8")).toBe("canvas");
    expect(detectStreamProtocol(null)).toBe("canvas");
  });

  it("maps resolution tiers to target heights and picks closest ABR representation index without tearing down stream", () => {
    expect(resolutionTierToHeight("720p")).toBe(720);
    expect(resolutionTierToHeight("1080p")).toBe(1080);
    expect(resolutionTierToHeight("2160p")).toBe(2160);

    const ladderHeights = [360, 480, 720, 1080, 2160];
    expect(pickClosestQualityIndex(ladderHeights, "AUTO")).toBe(-1);
    expect(pickClosestQualityIndex(ladderHeights, "720p")).toBe(2);
    expect(pickClosestQualityIndex(ladderHeights, "1080p")).toBe(3);
    expect(pickClosestQualityIndex(ladderHeights, "2160p")).toBe(4);
    expect(pickClosestQualityIndex(ladderHeights, "1440p")).toBe(3);
  });

  it("computes forward buffer occupancy in seconds from HTML5 TimeRanges", () => {
    const fakeRanges = {
      length: 2,
      start: (idx: number) => (idx === 0 ? 0 : 100),
      end: (idx: number) => (idx === 0 ? 35 : 142.4),
    } as unknown as TimeRanges;

    expect(computeBufferedAheadSeconds(fakeRanges, 10)).toBe(25);
    expect(computeBufferedAheadSeconds(fakeRanges, 112)).toBe(30.4);
    expect(computeBufferedAheadSeconds(fakeRanges, 60)).toBe(0);
    expect(computeBufferedAheadSeconds(null, 10)).toBe(0);
  });
});
