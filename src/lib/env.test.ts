import { describe, expect, it } from "vitest";

import { normalizeDatabaseUrl, parseEmailSender, parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts the minimum production-safe configuration without exposing secrets", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://user:pass@db.neon.tech/neondb?sslmode=require",
      PAYLOAD_SECRET: "a-secure-secret-with-enough-length",
      NEXT_PUBLIC_SITE_URL: "https://kenyatanzaniasafariadventure.com",
      PORTAL_HOST: "portal.kenyatanzaniasafariadventure.com",
      PAYLOAD_SERVER_URL: "https://portal.kenyatanzaniasafariadventure.com",
      ADMIN_EMAIL_DOMAIN: "naturerompsafaris.com",
      RESEND_API_KEY: "re_test_key",
      ENQUIRY_TO_EMAIL: "info@naturerompsafaris.com",
      ENQUIRY_FROM_EMAIL: "Nature Romp Safaris <onboarding@resend.dev>",
      WHATSAPP_NUMBER: "+254742637176",
    });

    expect(env.NEXT_PUBLIC_SITE_URL).toBe(
      "https://kenyatanzaniasafariadventure.com",
    );
    expect(env.PORTAL_HOST).toBe("portal.kenyatanzaniasafariadventure.com");
    expect(env.PAYLOAD_SERVER_URL).toBe(
      "https://portal.kenyatanzaniasafariadventure.com",
    );
    expect(env.ADMIN_EMAIL_DOMAIN).toBe("naturerompsafaris.com");
    expect(env.getEmailFromAddress()).toBe("onboarding@resend.dev");
    expect(env.getEmailFromName()).toBe("Nature Romp Safaris");
    expect(JSON.stringify(env)).not.toContain("a-secure-secret");
    expect(env.hasEmailProvider).toBe(true);
  });

  it("rejects missing required server configuration", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});

describe("parseEmailSender", () => {
  it("splits a friendly email sender into name and address", () => {
    expect(parseEmailSender("Nature Romp Safaris <portal@example.com>")).toEqual({
      address: "portal@example.com",
      name: "Nature Romp Safaris",
    });
  });

  it("uses the brand name when only an address is provided", () => {
    expect(parseEmailSender("portal@example.com")).toEqual({
      address: "portal@example.com",
      name: "Nature Romp Safaris",
    });
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
