"use client";

import { Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function EnquiryForm({
  subject = "Kenya Tanzania safari adventure",
  variant = "solid",
}: {
  subject?: string;
  variant?: "solid" | "light";
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("sending");
    const response = await fetch("/api/enquiry", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "content-type": "application/json" },
    });
    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <form action={submit} className={`enquiry-form enquiry-form--${variant}`}>
      <h3>Get In Touch</h3>
      <input name="company" className="honeypot" tabIndex={-1} autoComplete="off" />
      <div className="form-grid">
        <label>
          Name
          <input name="name" placeholder="Name*" required />
        </label>
        <label>
          Email Address
          <input name="email" type="email" placeholder="Email Address" required />
        </label>
        <label>
          Phone
          <input name="phone" placeholder="Phone Number" />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" placeholder="WhatsApp" />
        </label>
      </div>
      <input name="subject" defaultValue={subject} type="hidden" />
      <input name="sourcePage" value={pathname} readOnly type="hidden" />
      <label>
        Message
        <textarea name="message" rows={5} placeholder="Tell us your travel dates, group size and preferred safari route." required />
      </label>
      <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
        <Send size={16} /> {status === "sending" ? "Sending..." : "Submit Query"}
      </button>
      {status === "sent" && <p className="form-status">Thank you. Nature Romp Safaris will respond shortly.</p>}
      {status === "error" && <p className="form-status form-status--error">Please check the required fields or contact us on WhatsApp.</p>}
    </form>
  );
}
