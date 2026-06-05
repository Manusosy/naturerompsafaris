import { describe, expect, it } from "vitest";

import { buildEnquiryEmailBody, buildEnquiryEmailSubject } from "./enquiry-email";

describe("enquiry email formatting", () => {
  it("builds a branded subject line", () => {
    expect(
      buildEnquiryEmailSubject({
        name: "Jane",
        email: "jane@example.com",
        message: "Hello",
        subject: "July safari",
      }),
    ).toBe("Safari enquiry: July safari");
  });

  it("includes key enquiry fields in the email body", () => {
    const body = buildEnquiryEmailBody({
      name: "Jane Safari",
      email: "jane@example.com",
      message: "We want a private safari.",
      phone: "+254722714812",
      sourcePage: "/contact",
    });

    expect(body).toContain("Jane Safari");
    expect(body).toContain("jane@example.com");
    expect(body).toContain("We want a private safari.");
    expect(body).toContain("/contact");
  });
});
