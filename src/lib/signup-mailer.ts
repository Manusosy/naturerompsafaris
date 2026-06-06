import nodemailer from "nodemailer";

import { getEnv } from "@/lib/env";

function signupSmtpTransport() {
  const env = getEnv();
  if (!env.hasSignupSmtpProvider) return null;

  return nodemailer.createTransport({
    auth: {
      pass: env.getSignupSmtpPassword(),
      user: env.SIGNUP_SMTP_USER,
    },
    host: env.SIGNUP_SMTP_HOST,
    port: env.SIGNUP_SMTP_PORT,
    secure: env.SIGNUP_SMTP_PORT === 465,
  });
}

export async function sendSignupVerificationEmail({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  const env = getEnv();
  const transporter = signupSmtpTransport();
  if (!transporter) {
    throw new Error("Signup SMTP is not configured");
  }

  const text = [
    "Nature Romp Safaris portal signup verification",
    "",
    `Your one-time verification code is: ${code}`,
    "",
    "This code expires in 10 minutes and can only be used once.",
    "If you did not request portal access, you can ignore this email.",
  ].join("\n");

  await transporter.sendMail({
    from: env.SIGNUP_FROM_EMAIL,
    subject: "Your Nature Romp Safaris portal verification code",
    text,
    to: email,
  });
}
