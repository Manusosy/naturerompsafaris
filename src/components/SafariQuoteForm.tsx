"use client";

import { CalendarDays, Send, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SafariQuoteFormProps = {
  compact?: boolean;
  destination?: string;
  sourceTrip?: string;
  subject?: string;
};

const destinations = [
  "Kenya safari",
  "Tanzania safari",
  "Kenya and Tanzania safari",
  "Masai Mara and Serengeti",
  "Nairobi day trip",
  "Beach extension",
  "Not sure yet",
];

const accommodationOptions = ["Economy", "Comfort", "Luxury", "Deluxe", "Mixed / advise me"];
const planningStages = ["Ready to book", "Comparing options", "Early research", "Need expert advice"];
const tripTypes = ["Wildlife safari", "Family safari", "Honeymoon", "Private safari", "Group joining", "Beach and safari"];
const referralSources = ["Google search", "Google reviews", "Social media", "Friend referral", "Returning client", "Other"];

export function SafariQuoteForm({
  compact = false,
  destination,
  sourceTrip,
  subject = "Safari quote request",
}: SafariQuoteFormProps) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("sending");
    const payload = Object.fromEntries(formData);
    payload.message = String(payload.comments || payload.message || "Safari quote request");

    const response = await fetch("/api/enquiry", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <form action={submit} className={compact ? "safari-quote-form safari-quote-form--compact" : "safari-quote-form"}>
      <input autoComplete="off" className="honeypot" name="company" tabIndex={-1} />
      <input name="subject" type="hidden" value={subject} />
      <input name="sourcePage" type="hidden" value={pathname} />
      <input name="sourceTrip" type="hidden" value={sourceTrip ?? ""} />

      <section className="quote-section">
        <div className="quote-section__title">
          <Users size={18} />
          <h3>Tell us about yourself</h3>
        </div>
        <div className="quote-grid">
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" required type="email" /></label>
          <label>Phone<input name="phone" required /></label>
          <label>Nationality<input name="nationality" /></label>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-section__title">
          <CalendarDays size={18} />
          <h3>Safari plan</h3>
        </div>
        <div className="quote-grid">
          <label>
            Destination
            <select defaultValue={destination ?? ""} name="destinationChoice">
              <option value="">Choose destination</option>
              {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Travel days<input name="travelDays" placeholder="e.g. 8 days" /></label>
          <label>Start date<input name="startDate" type="date" /></label>
          <label>End date<input name="endDate" type="date" /></label>
          <label className="quote-check">
            <input name="flexibleDates" type="checkbox" />
            My dates are flexible
          </label>
        </div>
      </section>

      <section className="quote-section">
        <h3>Travelers and budget</h3>
        <div className="quote-grid quote-grid--thirds">
          <label>Adults<input min="1" name="adults" type="number" /></label>
          <label>Children below 13<input min="0" name="children" type="number" /></label>
          <label>Infants<input min="0" name="infants" type="number" /></label>
          <label>
            Accommodation
            <select name="accommodationPreference">
              <option value="">Select preference</option>
              {accommodationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Budget per person<input name="budgetPerPerson" placeholder="e.g. USD 1,500 - 2,500" /></label>
          <label>Budget range<input name="budgetRange" placeholder="Flexible, mid-range, luxury..." /></label>
        </div>
      </section>

      <section className="quote-section">
        <h3>Planning details</h3>
        <div className="quote-grid">
          <label>
            Planning stage
            <select name="planningStage">
              <option value="">Select stage</option>
              {planningStages.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Trip type
            <select name="tripType">
              <option value="">Select trip type</option>
              {tripTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            How did you hear about us?
            <select name="referralSource">
              <option value="">Select source</option>
              {referralSources.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="quote-full">
          Additional comments
          <textarea name="comments" placeholder="Tell us preferred parks, comfort level, occasion, or anything Nature Romp Safaris should know." rows={compact ? 4 : 6} />
        </label>
      </section>

      <button className="btn btn--primary quote-submit" disabled={status === "sending"} type="submit">
        <Send size={16} /> {status === "sending" ? "Sending..." : "Send request"}
      </button>
      {status === "sent" ? <p className="form-status">Request received. Nature Romp Safaris will respond shortly.</p> : null}
      {status === "error" ? <p className="form-status form-status--error">Please check the form or contact us on WhatsApp.</p> : null}
    </form>
  );
}
