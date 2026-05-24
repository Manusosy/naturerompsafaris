import { describe, expect, it } from "vitest";

import { normalizeDatabaseUrl, parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts the minimum production-safe configuration without exposing secrets", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://user:pass@db.neon.tech/neondb?sslmode=require",
      PAYLOAD_SECRET: "a-secure-secret-with-enough-length",
      NEXT_PUBLIC_SITE_URL: "https://kenyatanzaniasafariadventure.com",
      PORTAL_HOST: "portal.kenyatanzaniasafariadventure.com",
      RESEND_API_KEY: "re_test_key",
      ENQUIRY_TO_EMAIL: "info@naturerompsafaris.com",
      ENQUIRY_FROM_EMAIL: "Nature Romp Safaris <onboarding@resend.dev>",
      WHATSAPP_NUMBER: "+254742637176",
    });

    expect(env.NEXT_PUBLIC_SITE_URL).toBe(
      "https://kenyatanzaniasafariadventure.com",
    );
    expect(env.PORTAL_HOST).toBe("portal.kenyatanzaniasafariadventure.com");
    expect(JSON.stringify(env)).not.toContain("a-secure-secret");
    expect(env.hasEmailProvider).toBe(true);
  });

  it("rejects missing required server configuration", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});

describe("normalizeDatabaseUrl", () => {
  it("keeps current pg SSL behavior without the deprecated sslmode warning", () => {
    const normalized = normalizeDatabaseUrl(
      "postgresql://user:pass@db.neon.tech/neondb?sslmode=require",
    );

    expect(new URL(normalized).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("rejects placeholder database hosts before Payload tries to connect", () => {
    expect(() =>
      normalizeDatabaseUrl(
        "postgresql://user:pass@example.com/neondb?sslmode=require",
      ),
    ).toThrow(/placeholder host/);
  });
});
