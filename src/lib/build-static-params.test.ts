import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldSkipBuildTimePayload } from "./build-static-params";

describe("shouldSkipBuildTimePayload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips Payload static params when the build opts out of database access", () => {
    vi.stubEnv("SKIP_DB_DURING_BUILD", "true");

    expect(shouldSkipBuildTimePayload()).toBe(true);
  });

  it("does not skip on generic CI runners that still have a database", () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("SKIP_DB_DURING_BUILD", undefined);

    expect(shouldSkipBuildTimePayload()).toBe(false);
  });

  it("does not skip during production builds (e.g. Vercel sets CI=true)", () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SKIP_DB_DURING_BUILD", undefined);

    expect(shouldSkipBuildTimePayload()).toBe(false);
  });
});
