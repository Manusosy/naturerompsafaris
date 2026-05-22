import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PAYLOAD_SECRET: z.string().min(24, "PAYLOAD_SECRET must be at least 24 characters"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://kenyatanzaniasafariadventure.com"),
  RESEND_API_KEY: z.string().optional(),
  ENQUIRY_TO_EMAIL: z.string().email().default("info@naturerompsafaris.com"),
  ENQUIRY_FROM_EMAIL: z
    .string()
    .default("Nature Romp Safaris <onboarding@resend.dev>"),
  WHATSAPP_NUMBER: z.string().default("+254742637176"),
});

export type AppEnv = {
  DATABASE_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  ENQUIRY_TO_EMAIL: string;
  ENQUIRY_FROM_EMAIL: string;
  WHATSAPP_NUMBER: string;
  hasEmailProvider: boolean;
  getPayloadSecret: () => string;
  getResendApiKey: () => string | undefined;
};

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join(".") || issue.message)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${missing}`);
  }

  const values = parsed.data;

  return {
    DATABASE_URL: values.DATABASE_URL,
    NEXT_PUBLIC_SITE_URL: values.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
    ENQUIRY_TO_EMAIL: values.ENQUIRY_TO_EMAIL,
    ENQUIRY_FROM_EMAIL: values.ENQUIRY_FROM_EMAIL,
    WHATSAPP_NUMBER: values.WHATSAPP_NUMBER,
    hasEmailProvider: Boolean(values.RESEND_API_KEY),
    getPayloadSecret: () => values.PAYLOAD_SECRET,
    getResendApiKey: () => values.RESEND_API_KEY,
  };
}

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
