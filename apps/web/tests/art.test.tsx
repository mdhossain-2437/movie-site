import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KeyArt } from "@/components/art/key-art";
import { FIXTURE_TITLES } from "@/lib/catalogue/fixtures";

afterEach(cleanup);
describe("original generated key art", () => {
  it("renders every motif without external imagery, inaccessible text or duplicate gradient IDs", () => {
    const { container } = render(
      <div>
        {FIXTURE_TITLES.flatMap((title) => [
          <KeyArt key={`${title.slug}-p`} spec={title.art} />,
          <KeyArt key={`${title.slug}-b`} spec={title.art} variant="backdrop" />,
        ])}
      </div>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(FIXTURE_TITLES.length * 2);
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg.querySelectorAll("path, circle, rect, polygon").length).toBeGreaterThan(5);
    }
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector("image, img, text, foreignObject")).toBeNull();
  });
});
