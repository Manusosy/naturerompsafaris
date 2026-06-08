"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Mail, MessageCircle, Save } from "lucide-react";

import { StatusBadge } from "@/components/portal/PortalCards";
import {
  buildEnquiryMailto,
  buildEnquiryWhatsAppHref,
  getEnquiryCustomerPhone,
  getEnquirySourceHref,
  inferEnquiryFormType,
} from "@/lib/portal/enquiry-helpers";
import { formatValue, getValue } from "@/lib/portal/format";

const statusOptions = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Quoted", value: "quoted" },
  { label: "Booked", value: "booked" },
  { label: "Closed", value: "closed" },
];

function DetailField({ label, value }: { label: string; value: unknown }) {
  const formatted = formatValue(value);
  if (formatted === "-") return null;
  return (
    <div className="enquiry-detail__field">
      <span>{label}</span>
      <strong>{formatted}</strong>
    </div>
  );
}

export function EnquiryDetail({ document }: { document: Record<string, unknown> }) {
  const router = useRouter();
  const id = String(document.id);
  const [status, setStatus] = useState(String(getValue(document, "status") ?? "new"));
  const [internalNotes, setInternalNotes] = useState(String(getValue(document, "internalNotes") ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const mailto = buildEnquiryMailto(document);
  const whatsappHref = buildEnquiryWhatsAppHref(document);
  const sourceHref = getEnquirySourceHref(document);
  const formType = inferEnquiryFormType(document);
  const customerPhone = getEnquiryCustomerPhone(document);

  async function saveChanges(nextStatus?: string) {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "enquiries",
        data: {
          internalNotes,
          status: nextStatus ?? status,
        },
        id,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setSaving(false);
    if (res.ok) {
      if (nextStatus) setStatus(nextStatus);
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="enquiry-detail">
      <div className="enquiry-detail__top">
        <Link className="enquiry-detail__back" href="/admin/enquiries">
          <ArrowLeft size={16} /> Back to enquiries
        </Link>
        <div className="enquiry-detail__title-row">
          <div>
            <h1>{formatValue(getValue(document, "name"))}</h1>
            <p>
              {formatValue(getValue(document, "email"))}
              {customerPhone ? ` · ${customerPhone}` : ""}
            </p>
          </div>
          <div className="enquiry-detail__meta">
            <StatusBadge value={status} />
            <span className={`enquiry-type-badge enquiry-type-badge--${formType}`}>
              {formType === "quote" ? "Full quote form" : "Quick enquiry"}
            </span>
            <span className="enquiry-detail__received">
              Received {formatValue(getValue(document, "createdAt"))}
            </span>
          </div>
        </div>
      </div>

      <div className="enquiry-detail__primary-actions">
        <a className="enquiry-action-btn enquiry-action-btn--primary" href={mailto}>
          <Mail size={16} /> Reply by email
        </a>
        {whatsappHref ? (
          <a
            className="enquiry-action-btn enquiry-action-btn--whatsapp"
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        ) : (
          <span className="enquiry-action-btn enquiry-action-btn--disabled" title="No phone or WhatsApp on this enquiry">
            <MessageCircle size={16} /> No WhatsApp number
          </span>
        )}
      </div>

      <div className="enquiry-detail__actions">
        {sourceHref ? (
          <a
            className="enquiry-action-btn"
            href={sourceHref}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={16} /> View source page
          </a>
        ) : null}
        <button
          className="enquiry-action-btn"
          disabled={saving || status === "contacted"}
          onClick={() => saveChanges("contacted")}
          type="button"
        >
          Mark contacted
        </button>
        <button
          className="enquiry-action-btn"
          disabled={saving || status === "quoted"}
          onClick={() => saveChanges("quoted")}
          type="button"
        >
          Mark quoted
        </button>
        <button
          className="enquiry-action-btn"
          disabled={saving || status === "closed"}
          onClick={() => saveChanges("closed")}
          type="button"
        >
          Close
        </button>
      </div>

      <div className="enquiry-detail__grid">
        <section className="enquiry-detail__panel">
          <h2>Traveler</h2>
          <DetailField label="Name" value={getValue(document, "name")} />
          <DetailField label="Email" value={getValue(document, "email")} />
          <DetailField label="Phone" value={getValue(document, "phone")} />
          <DetailField label="WhatsApp" value={getValue(document, "whatsapp")} />
          <DetailField label="Nationality" value={getValue(document, "nationality")} />
        </section>

        <section className="enquiry-detail__panel">
          <h2>Safari plan</h2>
          <DetailField label="Subject" value={getValue(document, "subject")} />
          <DetailField label="Destination" value={getValue(document, "destinationChoice")} />
          <DetailField label="Travel days" value={getValue(document, "travelDays")} />
          <DetailField label="Start date" value={getValue(document, "startDate") ?? getValue(document, "tourStartDate")} />
          <DetailField label="End date" value={getValue(document, "endDate")} />
          <DetailField label="Flexible dates" value={getValue(document, "flexibleDates")} />
          <DetailField label="Adults" value={getValue(document, "adults")} />
          <DetailField label="Children under 13" value={getValue(document, "children")} />
          <DetailField label="Infants" value={getValue(document, "infants")} />
          <DetailField label="Accommodation" value={getValue(document, "accommodationPreference")} />
          <DetailField label="Budget per person" value={getValue(document, "budgetPerPerson")} />
          <DetailField label="Budget range" value={getValue(document, "budgetRange")} />
          <DetailField label="Planning stage" value={getValue(document, "planningStage")} />
          <DetailField label="Trip type" value={getValue(document, "tripType")} />
          <DetailField label="Referral source" value={getValue(document, "referralSource")} />
        </section>
      </div>

      <section className="enquiry-detail__panel enquiry-detail__panel--full">
        <h2>Message</h2>
        <p className="enquiry-detail__message">{formatValue(getValue(document, "message"))}</p>
        {formatValue(getValue(document, "comments")) !== "-" ? (
          <>
            <h3>Additional comments</h3>
            <p className="enquiry-detail__message">{formatValue(getValue(document, "comments"))}</p>
          </>
        ) : null}
      </section>

      <section className="enquiry-detail__panel enquiry-detail__panel--full">
        <h2>Source</h2>
        <div className="enquiry-detail__source-grid">
          <DetailField label="Page" value={getValue(document, "sourcePage")} />
          <DetailField
            label="Trip"
            value={
              getValue(document, "sourceTrip") && typeof getValue(document, "sourceTrip") === "object"
                ? (getValue(document, "sourceTrip") as Record<string, unknown>).title
                : undefined
            }
          />
        </div>
      </section>

      <section className="enquiry-detail__panel enquiry-detail__panel--full">
        <div className="enquiry-detail__notes-head">
          <h2>Internal notes &amp; status</h2>
          <div className="enquiry-detail__notes-controls">
            <label>
              Status
              <select onChange={(event) => setStatus(event.target.value)} value={status}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="enquiry-action-btn enquiry-action-btn--primary"
              disabled={saving}
              onClick={() => saveChanges()}
              type="button"
            >
              <Save size={16} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <textarea
          className="enquiry-detail__notes"
          onChange={(event) => setInternalNotes(event.target.value)}
          placeholder="Team notes, quote sent, follow-up date, etc."
          rows={6}
          value={internalNotes}
        />
        {saved ? <p className="enquiry-detail__saved">Changes saved.</p> : null}
      </section>
    </div>
  );
}
