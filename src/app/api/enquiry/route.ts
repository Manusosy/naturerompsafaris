import { NextResponse } from "next/server";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import { Resend } from "resend";

import { type Enquiry, validateEnquiry } from "@/lib/enquiry";
import { getEnv } from "@/lib/env";

const recentSubmissions = new Map<string, number>();

function isRateLimited(key: string) {
  const now = Date.now();
  const previous = recentSubmissions.get(key) ?? 0;
  if (now - previous < 60_000) return true;
  recentSubmissions.set(key, now);
  return false;
}

function quoteSummary(data: Enquiry) {
  return [
    data.message,
    "",
    "Quote details:",
    `Nationality: ${data.nationality || "-"}`,
    `Destination choice: ${data.destinationChoice || "-"}`,
    `Travel days: ${data.travelDays || "-"}`,
    `Preferred start date: ${data.startDate || data.tourStartDate || "-"}`,
    `Preferred end date: ${data.endDate || "-"}`,
    `Flexible dates: ${data.flexibleDates ? "Yes" : "No"}`,
    `Adults: ${data.adults || "-"}`,
    `Children under 13: ${data.children || "-"}`,
    `Infants: ${data.infants || "-"}`,
    `Accommodation preference: ${data.accommodationPreference || "-"}`,
    `Budget range: ${data.budgetRange || "-"}`,
    `Budget per person: ${data.budgetPerPerson || "-"}`,
    `Planning stage: ${data.planningStage || "-"}`,
    `Trip type: ${data.tripType || "-"}`,
    `Referral source: ${data.referralSource || "-"}`,
    data.comments ? `Additional comments: ${data.comments}` : "",
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Please wait before sending another enquiry." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = validateEnquiry(body);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const env = getEnv();
  const apiKey = env.getResendApiKey();
  const payload = await getPayload({ config: configPromise });

  try {
    await payload.create({
      collection: "enquiries",
      data: {
        ...result.data,
        sourceTrip: result.data.sourceTrip || undefined,
        status: "new",
      },
      overrideAccess: true,
    });
  } catch (error) {
    console.error("Full enquiry save failed. Saving compact fallback.", error);
    await payload.create({
      collection: "enquiries",
      data: {
        email: result.data.email,
        message: quoteSummary(result.data),
        name: result.data.name,
        phone: result.data.phone,
        sourcePage: result.data.sourcePage,
        status: "new",
        subject: result.data.subject,
      },
      overrideAccess: true,
    });
  }

  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: env.ENQUIRY_FROM_EMAIL,
      to: env.ENQUIRY_TO_EMAIL,
      subject: `Safari enquiry: ${result.data.subject || "Kenya Tanzania Safari Adventure"}`,
      replyTo: result.data.email,
      text: [
        `Name: ${result.data.name}`,
        `Email: ${result.data.email}`,
        `Phone: ${result.data.phone || "-"}`,
        `WhatsApp: ${result.data.whatsapp || "-"}`,
        `Nationality: ${result.data.nationality || "-"}`,
        `Destination choice: ${result.data.destinationChoice || "-"}`,
        `Subject: ${result.data.subject || "-"}`,
        `Source: ${result.data.sourcePage || "-"}`,
        `Trip ID: ${result.data.sourceTrip || "-"}`,
        `Adults: ${result.data.adults || "-"}`,
        `Children under 13: ${result.data.children || "-"}`,
        `Infants: ${result.data.infants || "-"}`,
        `Travel days: ${result.data.travelDays || "-"}`,
        `Tour start date: ${result.data.tourStartDate || "-"}`,
        `Preferred start date: ${result.data.startDate || "-"}`,
        `Preferred end date: ${result.data.endDate || "-"}`,
        `Flexible dates: ${result.data.flexibleDates ? "Yes" : "No"}`,
        `Accommodation preference: ${result.data.accommodationPreference || "-"}`,
        `Budget range: ${result.data.budgetRange || "-"}`,
        `Budget per person: ${result.data.budgetPerPerson || "-"}`,
        `Planning stage: ${result.data.planningStage || "-"}`,
        `Trip type: ${result.data.tripType || "-"}`,
        `Referral source: ${result.data.referralSource || "-"}`,
        "",
        result.data.message,
        result.data.comments ? `\nAdditional comments:\n${result.data.comments}` : "",
      ].join("\n"),
    });
  }

  return NextResponse.json({ ok: true });
}
