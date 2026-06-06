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

type ContactTab = "general" | "safari" | "inquiry";

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

const generalTopics = [
  "General question",
  "Feedback",
  "Media or partnership",
  "Travel information",
  "Other",
];

const inquiryTypes = [
  "Existing booking question",
  "Payment or invoice",
  "Itinerary change",
  "Travel date update",
  "Complaint or issue",
  "Other enquiry",
];

const tabCopy: Record<ContactTab, { intro: string; subject: string }> = {
  general: {
    intro: "Send a quick message for general questions, feedback, or anything that does not need a full safari quote.",
    subject: "General contact enquiry",
  },
  inquiry: {
    intro: "Already planning with us or need help with an existing enquiry? Share the details here.",
    subject: "Follow-up enquiry",
  },
  safari: {
    intro: "Tell us about your dream safari and we will prepare a tailored Kenya or Tanzania proposal.",
    subject: "Website safari quote request",
  },
};

export function SafariQuoteForm({
  compact = false,
  destination,
  sourceTrip,
  subject = "Website safari quote request",
}: SafariQuoteFormProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ContactTab>("general");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("sending");
    const payload = Object.fromEntries(formData);
    const tabSubject = String(payload.subject || subject);
    payload.subject = tabSubject;
    payload.message = String(
      payload.comments ||
        payload.message ||
        (activeTab === "safari" ? "Safari quote request" : tabSubject),
    );

    const response = await fetch("/api/enquiry", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    setStatus(response.ok ? "sent" : "error");
  }

  const activeSubject = activeTab === "safari" ? subject : tabCopy[activeTab].subject;

  return (
    <div className="contact-form-tabs">
      <div aria-label="Contact form type" className="contact-form-tabs__list" role="tablist">
        <button
          aria-selected={activeTab === "general"}
          className={activeTab === "general" ? "contact-form-tabs__tab is-active" : "contact-form-tabs__tab"}
          onClick={() => setActiveTab("general")}
          role="tab"
          type="button"
        >
          General Contact
        </button>
        <button
          aria-selected={activeTab === "safari"}
          className={activeTab === "safari" ? "contact-form-tabs__tab is-active" : "contact-form-tabs__tab"}
          onClick={() => setActiveTab("safari")}
          role="tab"
          type="button"
        >
          Safari Quote
        </button>
        <button
          aria-selected={activeTab === "inquiry"}
          className={activeTab === "inquiry" ? "contact-form-tabs__tab is-active" : "contact-form-tabs__tab"}
          onClick={() => setActiveTab("inquiry")}
          role="tab"
          type="button"
        >
          Other Enquiry
        </button>
      </div>

      <p className="contact-form-tabs__intro">{tabCopy[activeTab].intro}</p>

      <form action={submit} className={compact ? "safari-quote-form safari-quote-form--compact" : "safari-quote-form"}>
        <input autoComplete="off" className="honeypot" name="company" tabIndex={-1} />
        <input name="subject" type="hidden" value={activeSubject} />
        <input name="sourcePage" type="hidden" value={pathname} />
        <input name="sourceTrip" type="hidden" value={sourceTrip ?? ""} />

        {activeTab === "general" ? (
          <>
            <section className="quote-section">
              <div className="quote-section__title">
                <Users size={18} />
                <h3>Your details</h3>
              </div>
              <div className="quote-grid">
                <label>Name<input name="name" required /></label>
                <label>Email<input name="email" required type="email" /></label>
                <label>Phone<input name="phone" /></label>
                <label>
                  Topic
                  <select defaultValue={generalTopics[0]} name="planningStage">
                    {generalTopics.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="quote-full">
                Message
                <textarea
                  name="message"
                  placeholder="How can Nature Romp Safaris help you today?"
                  required
                  rows={compact ? 5 : 7}
                />
              </label>
            </section>
          </>
        ) : null}

        {activeTab === "inquiry" ? (
          <>
            <section className="quote-section">
              <div className="quote-section__title">
                <Users size={18} />
                <h3>Your details</h3>
              </div>
              <div className="quote-grid">
                <label>Name<input name="name" required /></label>
                <label>Email<input name="email" required type="email" /></label>
                <label>Phone<input name="phone" required /></label>
                <label>
                  Enquiry type
                  <select defaultValue={inquiryTypes[0]} name="tripType">
                    {inquiryTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="quote-full">
                Message
                <textarea
                  name="message"
                  placeholder="Share your booking reference, dates, or question so we can respond accurately."
                  required
                  rows={compact ? 5 : 7}
                />
              </label>
            </section>
          </>
        ) : null}

        {activeTab === "safari" ? (
          <>
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
                    {destinations.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
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
                    {accommodationOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
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
                    {planningStages.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trip type
                  <select name="tripType">
                    <option value="">Select trip type</option>
                    {tripTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  How did you hear about us?
                  <select name="referralSource">
                    <option value="">Select source</option>
                    {referralSources.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="quote-full">
                Additional comments
                <textarea
                  name="comments"
                  placeholder="Tell us preferred parks, comfort level, occasion, or anything Nature Romp Safaris should know."
                  rows={compact ? 4 : 6}
                />
              </label>
            </section>
          </>
        ) : null}

        <button className="btn btn--primary quote-submit" disabled={status === "sending"} type="submit">
          <Send size={16} /> {status === "sending" ? "Sending..." : "Send request"}
        </button>
        {status === "sent" ? <p className="form-status">Request received. Nature Romp Safaris will respond shortly.</p> : null}
        {status === "error" ? (
          <p className="form-status form-status--error">Please check the form or contact us on WhatsApp.</p>
        ) : null}
      </form>
    </div>
  );
}
