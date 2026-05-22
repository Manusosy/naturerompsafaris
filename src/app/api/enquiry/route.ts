import { NextResponse } from "next/server";
import { Resend } from "resend";

import { validateEnquiry } from "@/lib/enquiry";
import { getEnv } from "@/lib/env";

const recentSubmissions = new Map<string, number>();

function isRateLimited(key: string) {
  const now = Date.now();
  const previous = recentSubmissions.get(key) ?? 0;
  if (now - previous < 60_000) return true;
  recentSubmissions.set(key, now);
  return false;
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
        `Subject: ${result.data.subject || "-"}`,
        `Source: ${result.data.sourcePage || "-"}`,
        "",
        result.data.message,
      ].join("\n"),
    });
  }

  return NextResponse.json({ ok: true });
}
