import { createWhatsAppLink } from "../enquiry";
import { formatValue, getValue } from "./format";

export type EnquiryDoc = Record<string, unknown>;

export function getEnquiryCustomerPhone(doc: EnquiryDoc): string | null {
  const whatsapp = String(getValue(doc, "whatsapp") ?? "").trim();
  const phone = String(getValue(doc, "phone") ?? "").trim();
  const raw = whatsapp || phone;
  if (!raw || raw.replace(/\D/g, "").length < 8) return null;
  return raw;
}

export function buildEnquiryWhatsAppMessage(doc: EnquiryDoc): string {
  const name = formatValue(getValue(doc, "name"));
  const subject = formatValue(getValue(doc, "subject"));
  const destination = formatValue(getValue(doc, "destinationChoice"));
  const travelDays = formatValue(getValue(doc, "travelDays"));
  const startDate = formatValue(getValue(doc, "startDate") ?? getValue(doc, "tourStartDate"));
  const endDate = formatValue(getValue(doc, "endDate"));
  const adults = formatValue(getValue(doc, "adults"));
  const children = formatValue(getValue(doc, "children"));
  const trip = getValue(doc, "sourceTrip");
  const tripTitle =
    trip && typeof trip === "object"
      ? formatValue((trip as Record<string, unknown>).title)
      : "-";

  const lines = [
    `Hi ${name},`,
    "",
    "Thank you for your safari enquiry with Nature Romp Safaris.",
    subject !== "-" ? `Interest: ${subject}` : "",
    destination !== "-" ? `Destination: ${destination}` : "",
    tripTitle !== "-" ? `Trip: ${tripTitle}` : "",
    travelDays !== "-" ? `Duration: ${travelDays}` : "",
    startDate !== "-" ? `Preferred start: ${startDate}` : "",
    endDate !== "-" ? `Preferred end: ${endDate}` : "",
    adults !== "-" || children !== "-"
      ? `Travelers: ${adults} adults, ${children} children`
      : "",
    "",
    "I'd love to help plan your safari. When is a good time to chat?",
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildEnquiryWhatsAppHref(doc: EnquiryDoc): string | null {
  const phone = getEnquiryCustomerPhone(doc);
  if (!phone) return null;
  return createWhatsAppLink({ phone, message: buildEnquiryWhatsAppMessage(doc) });
}

export function buildEnquiryMailto(doc: EnquiryDoc): string {
  const email = String(getValue(doc, "email") ?? "");
  const subjectText = formatValue(getValue(doc, "subject"));
  const subject = encodeURIComponent(
    subjectText !== "-"
      ? `Re: ${subjectText} — Nature Romp Safaris`
      : "Re: Your safari enquiry — Nature Romp Safaris",
  );
  const body = encodeURIComponent(
    `Hi ${formatValue(getValue(doc, "name"))},\n\nThank you for contacting Nature Romp Safaris.\n\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function getEnquirySourceHref(doc: EnquiryDoc): string | null {
  const sourcePage = String(getValue(doc, "sourcePage") ?? "").trim();
  if (sourcePage.startsWith("/")) return sourcePage;

  const trip = getValue(doc, "sourceTrip");
  if (trip && typeof trip === "object" && "slug" in trip) {
    return `/trips/${String((trip as { slug: unknown }).slug)}`;
  }

  return sourcePage || null;
}

export function inferEnquiryFormType(doc: EnquiryDoc): "quick" | "quote" {
  const hasQuoteFields = [
    "destinationChoice",
    "travelDays",
    "adults",
    "planningStage",
    "budgetPerPerson",
  ].some((key) => {
    const value = getValue(doc, key);
    return Boolean(value && String(value).trim() && formatValue(value) !== "-");
  });
  return hasQuoteFields ? "quote" : "quick";
}

export function getEnquiryInterestLabel(doc: EnquiryDoc): string {
  const destination = formatValue(getValue(doc, "destinationChoice"));
  if (destination !== "-") return destination;

  const subject = formatValue(getValue(doc, "subject"));
  if (subject !== "-") return subject;

  const trip = getValue(doc, "sourceTrip");
  if (trip && typeof trip === "object") {
    return formatValue((trip as Record<string, unknown>).title);
  }

  return "-";
}
