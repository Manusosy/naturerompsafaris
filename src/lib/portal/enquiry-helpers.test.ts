import { describe, expect, it } from "vitest";

import {
  buildEnquiryWhatsAppHref,
  getEnquiryCustomerPhone,
  inferEnquiryFormType,
} from "./enquiry-helpers";

describe("enquiry helpers", () => {
  it("prefers whatsapp over phone for customer chat", () => {
    const doc = { phone: "+254 700 000001", whatsapp: "+254 711 000002" };
    expect(getEnquiryCustomerPhone(doc)).toBe("+254 711 000002");
  });

  it("builds a whatsapp link with a prefilled summary", () => {
    const doc = {
      adults: "2",
      children: "1",
      destinationChoice: "Kenya safari",
      name: "Jane Doe",
      phone: "+254722714812",
      subject: "Masai Mara trip",
      travelDays: "7 days",
    };
    const href = buildEnquiryWhatsAppHref(doc);
    expect(href).toContain("https://wa.me/254722714812");
    expect(href).toContain(encodeURIComponent("Jane Doe"));
    expect(href).toContain(encodeURIComponent("Kenya safari"));
  });

  it("infers quote vs quick form types", () => {
    expect(inferEnquiryFormType({ message: "Hello" })).toBe("quick");
    expect(
      inferEnquiryFormType({ destinationChoice: "Tanzania safari", message: "Hello" }),
    ).toBe("quote");
  });
});
