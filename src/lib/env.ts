import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PAYLOAD_SECRET: z.string().min(24, "PAYLOAD_SECRET must be at least 24 characters"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://kenyatanzaniasafariadventure.com"),
  PORTAL_HOST: z.string().default("portal.kenyatanzaniasafariadventure.com"),
  PAYLOAD_SERVER_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL_DOMAIN: z.string().default("naturerompsafaris.com"),
  PAYLOAD_DEV_SCHEMA_PUSH: z.enum(["true", "false"]).default("false"),
  ENQUIRY_TO_EMAIL: z.string().email().default("info@naturerompsafaris.com"),
  ENQUIRY_FROM_EMAIL: z
    .string()
    .default("Nature Romp Safaris <onboarding@resend.dev>"),
  WHATSAPP_NUMBER: z.string().default("+254742637176"),
});

export type AppEnv = {
  DATABASE_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  PORTAL_HOST: string;
  PAYLOAD_SERVER_URL: string;
  ENQUIRY_TO_EMAIL: string;
  ENQUIRY_FROM_EMAIL: string;
  WHATSAPP_NUMBER: string;
  ADMIN_EMAIL_DOMAIN: string;
  PAYLOAD_DEV_SCHEMA_PUSH: boolean;
  hasEmailProvider: boolean;
  getPayloadSecret: () => string;
  getResendApiKey: () => string | undefined;
  getEmailFromAddress: () => string;
  getEmailFromName: () => string;
};

export function normalizeDatabaseUrl(databaseUrl: string) {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol");
  }

  const placeholderHosts = new Set(["example.com", "host", "localhost.example"]);
  if (placeholderHosts.has(url.hostname.toLowerCase())) {
    throw new Error(
      "DATABASE_URL is still using a placeholder host. Set it to the real Neon Postgres connection string.",
    );
  }

  if (!url.username || !url.password) {
    throw new Error("DATABASE_URL must include the Neon database role and password");
  }

  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

export function parseEmailSender(sender: string) {
  const match = sender.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  if (match) {
    return {
      address: match[2].trim(),
      name: match[1].trim() || "Nature Romp Safaris",
    };
  }

  return {
    address: sender.trim(),
    name: "Nature Romp Safaris",
  };
}

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join(".") || issue.message)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${missing}`);
  }

  const values = parsed.data;
  const databaseUrl = normalizeDatabaseUrl(values.DATABASE_URL);
  const emailSender = parseEmailSender(values.ENQUIRY_FROM_EMAIL);

  return {
    DATABASE_URL: databaseUrl,
    NEXT_PUBLIC_SITE_URL: values.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
    PORTAL_HOST: values.PORTAL_HOST.toLowerCase(),
    PAYLOAD_SERVER_URL:
      values.PAYLOAD_SERVER_URL?.replace(/\/$/, "") ??
      `https://${values.PORTAL_HOST.toLowerCase()}`,
    ENQUIRY_TO_EMAIL: values.ENQUIRY_TO_EMAIL,
    ENQUIRY_FROM_EMAIL: values.ENQUIRY_FROM_EMAIL,
    WHATSAPP_NUMBER: values.WHATSAPP_NUMBER,
    ADMIN_EMAIL_DOMAIN: values.ADMIN_EMAIL_DOMAIN.toLowerCase().replace(/^@/, ""),
    PAYLOAD_DEV_SCHEMA_PUSH: values.PAYLOAD_DEV_SCHEMA_PUSH === "true",
    hasEmailProvider: Boolean(values.RESEND_API_KEY),
    getPayloadSecret: () => values.PAYLOAD_SECRET,
    getResendApiKey: () => values.RESEND_API_KEY,
    getEmailFromAddress: () => emailSender.address,
    getEmailFromName: () => emailSender.name,
  };
}

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
