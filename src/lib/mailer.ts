import nodemailer from "nodemailer";
import { Resend } from "resend";

import { getEnv } from "@/lib/env";

export type EnquiryEmailPayload = {
  replyTo: string;
  subject: string;
  text: string;
};

function smtpTransport() {
  const env = getEnv();
  if (!env.hasSmtpProvider) return null;

  return nodemailer.createTransport({
    auth: {
      pass: env.getSmtpPassword(),
      user: env.SMTP_USER,
    },
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
  });
}

export async function sendEnquiryEmail(payload: EnquiryEmailPayload) {
  const env = getEnv();

  if (env.hasSmtpProvider) {
    const transporter = smtpTransport();
    if (!transporter) return false;

    await transporter.sendMail({
      cc: env.ENQUIRY_CC_EMAIL,
      from: env.ENQUIRY_FROM_EMAIL,
      replyTo: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      to: env.ENQUIRY_TO_EMAIL,
    });
    return true;
  }

  const apiKey = env.getResendApiKey();
  if (!apiKey) return false;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    cc: env.ENQUIRY_CC_EMAIL ? [env.ENQUIRY_CC_EMAIL] : undefined,
    from: env.ENQUIRY_FROM_EMAIL,
    replyTo: payload.replyTo,
    subject: payload.subject,
    text: payload.text,
    to: env.ENQUIRY_TO_EMAIL,
  });
  return true;
}
