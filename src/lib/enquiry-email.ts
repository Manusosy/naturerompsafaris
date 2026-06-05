import type { Enquiry } from "@/lib/enquiry";

export function buildEnquiryEmailSubject(data: Enquiry) {
  return `Safari enquiry: ${data.subject || "Kenya Tanzania Safari Adventure"}`;
}

export function buildEnquiryEmailBody(data: Enquiry) {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "-"}`,
    `WhatsApp: ${data.whatsapp || "-"}`,
    `Nationality: ${data.nationality || "-"}`,
    `Destination choice: ${data.destinationChoice || "-"}`,
    `Subject: ${data.subject || "-"}`,
    `Source: ${data.sourcePage || "-"}`,
    `Trip ID: ${data.sourceTrip || "-"}`,
    `Adults: ${data.adults || "-"}`,
    `Children under 13: ${data.children || "-"}`,
    `Infants: ${data.infants || "-"}`,
    `Travel days: ${data.travelDays || "-"}`,
    `Tour start date: ${data.tourStartDate || "-"}`,
    `Preferred start date: ${data.startDate || "-"}`,
    `Preferred end date: ${data.endDate || "-"}`,
    `Flexible dates: ${data.flexibleDates ? "Yes" : "No"}`,
    `Accommodation preference: ${data.accommodationPreference || "-"}`,
    `Budget range: ${data.budgetRange || "-"}`,
    `Budget per person: ${data.budgetPerPerson || "-"}`,
    `Planning stage: ${data.planningStage || "-"}`,
    `Trip type: ${data.tripType || "-"}`,
    `Referral source: ${data.referralSource || "-"}`,
    "",
    data.message,
    data.comments ? `\nAdditional comments:\n${data.comments}` : "",
  ].join("\n");
}
