import { describe, expect, it } from "vitest";

import { createWhatsAppLink, validateEnquiry } from "./enquiry";

describe("validateEnquiry", () => {
  it("normalizes a valid safari enquiry", () => {
    const result = validateEnquiry({
      name: "  Jane Safari  ",
      email: "JANE@example.COM",
      phone: "+1 555 0100",
      whatsapp: "+1 555 0100",
      subject: "10 day Kenya Tanzania safari",
      message: "We want a private family safari in July.",
      sourcePage: "/kenya-tanzania-safari-adventures",
      company: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
      expect(result.data.name).toBe("Jane Safari");
      expect(result.data.sourcePage).toBe(
        "/kenya-tanzania-safari-adventures",
      );
    }
  });

  it("rejects spam honeypot submissions", () => {
    const result = validateEnquiry({
      name: "Bot",
      email: "bot@example.com",
      message: "hello",
      company: "Filled by bot",
    });

    expect(result.success).toBe(false);
  });
});

describe("createWhatsAppLink", () => {
  it("builds a click-to-chat link with safari context", () => {
    const url = createWhatsAppLink({
      phone: "+254 742 637176",
      message: "I am interested in a Kenya Tanzania safari adventure.",
    });

    expect(url).toContain("https://wa.me/254742637176");
    expect(url).toContain("Kenya%20Tanzania%20safari");
  });
});
