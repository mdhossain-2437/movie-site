import { describe, expect, it } from "vitest";
import { createProblemDetails, CursorPageQuerySchema, ProblemDetailsSchema } from "./index";

describe("@movie/contracts", () => {
  it("builds valid RFC 9457 Problem Details envelopes without leaking internals", () => {
    const problem = createProblemDetails({
      status: 403,
      code: "TERRITORY_RESTRICTED",
      title: "Content is not available",
      detail: "Not available in your region.",
      requestId: "req_123456",
    });

    const parsed = ProblemDetailsSchema.parse(problem);
    expect(parsed.type).toBe("urn:movie-platform:problem:territory-restricted");
    expect(parsed.status).toBe(403);
    expect(parsed.requestId).toBe("req_123456");
  });

  it("bounds pagination limit between 1 and 50", () => {
    expect(CursorPageQuerySchema.parse({}).limit).toBe(24);
    expect(() => CursorPageQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => CursorPageQuerySchema.parse({ limit: 500 })).toThrow();
  });
});
