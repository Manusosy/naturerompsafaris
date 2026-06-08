"use client";

import { CalendarDays, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type TripInquiryPrefill = {
  season?: string;
  tier?: string;
};

export type TripInquiryContext = {
  duration?: string;
  priceText?: string;
  route?: string;
  slug: string;
  title: string;
};

type TripInquiryFormProps = {
  context: TripInquiryContext;
  destination?: string;
  selectedOffer?: TripInquiryPrefill;
  sourceTrip?: string;
};

function buildInquiryMessage(
  context: TripInquiryContext,
  tripUrl: string,
  userNotes: string,
  selectedOffer?: TripInquiryPrefill,
) {
  const lines = [
    "Trip inquiry",
    `Trip: ${context.title}`,
    `Trip link: ${tripUrl}`,
    context.duration ? `Duration: ${context.duration}` : "",
    context.route ? `Route: ${context.route}` : "",
    context.priceText ? `Listed from: ${context.priceText}` : "",
    selectedOffer?.season
      ? `Pricing interest: ${[selectedOffer.tier, selectedOffer.season].filter(Boolean).join(" — ")}`
      : "",
    userNotes.trim() ? `\nGuest notes:\n${userNotes.trim()}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

export function TripInquiryForm({ context, destination, selectedOffer, sourceTrip }: TripInquiryFormProps) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [notes, setNotes] = useState("");
  const tripUrl =
    typeof window !== "undefined" ? `${window.location.origin}/trips/${context.slug}` : `/trips/${context.slug}`;
  const subject = `Trip inquiry: ${context.title}`;

  async function submit(formData: FormData) {
    setStatus("sending");
    const payload = Object.fromEntries(formData);
    payload.subject = subject;
    payload.message = buildInquiryMessage(context, tripUrl, notes, selectedOffer);
    payload.destinationChoice = destination || "";
    payload.comments = notes.trim();

    const response = await fetch("/api/enquiry", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <form action={submit} className="trip-inquiry-form">
      <input autoComplete="off" className="honeypot" name="company" tabIndex={-1} />
      <input name="sourcePage" type="hidden" value={tripUrl || pathname} />
      <input name="sourceTrip" type="hidden" value={sourceTrip ?? ""} />

      <div className="trip-inquiry-form__preview" aria-label="Trip being inquired about">
        <p className="trip-inquiry-form__preview-label">You are inquiring about</p>
        <strong>{context.title}</strong>
        <p>
          {[context.duration, context.route].filter(Boolean).join(" · ")}
        </p>
        {context.priceText ? <p>{context.priceText}</p> : null}
        {selectedOffer?.season ? (
          <p className="trip-inquiry-form__offer">
            Pricing selection: {[selectedOffer.tier, selectedOffer.season].filter(Boolean).join(" — ")}
          </p>
        ) : null}
      </div>

      <div className="trip-inquiry-form__grid">
        <label>
          Full name
          <input name="name" placeholder="Your name" required />
        </label>
        <label>
          Email
          <input name="email" placeholder="you@email.com" required type="email" />
        </label>
        <label className="trip-inquiry-form__full">
          Phone / WhatsApp
          <input name="phone" placeholder="+254..." required />
        </label>
        <label>
          <span className="trip-inquiry-form__label-row">
            <CalendarDays aria-hidden size={14} /> Travel from
          </span>
          <input name="startDate" type="date" />
        </label>
        <label>
          <span className="trip-inquiry-form__label-row">
            <CalendarDays aria-hidden size={14} /> Travel to
          </span>
          <input name="endDate" type="date" />
        </label>
        <label>
          Adults
          <input min="1" name="adults" placeholder="2" type="number" />
        </label>
        <label>
          Children
          <input min="0" name="children" placeholder="0" type="number" />
        </label>
        <label className="trip-inquiry-form__full">
          Additional notes <span className="trip-inquiry-form__optional">(optional)</span>
          <textarea
            name="comments"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any preferences, occasion, or questions for our team."
            rows={3}
            value={notes}
          />
        </label>
      </div>

      <button className="btn btn--primary trip-inquiry-form__submit" disabled={status === "sending"} type="submit">
        <Send size={16} /> {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>
      {status === "sent" ? (
        <p className="form-status">Inquiry received. Nature Romp Safaris will respond with a tailored quote.</p>
      ) : null}
      {status === "error" ? (
        <p className="form-status form-status--error">Please check the form or contact us on WhatsApp.</p>
      ) : null}
    </form>
  );
}
