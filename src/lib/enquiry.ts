import { z } from "zod";

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(180),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(60).optional().or(z.literal("")),
  subject: z.string().trim().max(180).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is required").max(3000),
  sourcePage: z.string().trim().max(240).optional().or(z.literal("")),
  adults: z.string().trim().max(20).optional().or(z.literal("")),
  infants: z.string().trim().max(20).optional().or(z.literal("")),
  company: z.string().optional(),
});

export type Enquiry = Omit<z.infer<typeof enquirySchema>, "company">;

export type EnquiryResult =
  | { success: true; data: Enquiry }
  | { success: false; errors: Record<string, string> };

export function validateEnquiry(input: unknown): EnquiryResult {
  const parsed = enquirySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  if (parsed.data.company?.trim()) {
    return { success: false, errors: { company: "Spam submission rejected" } };
  }

  const data = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp,
    subject: parsed.data.subject,
    message: parsed.data.message,
    sourcePage: parsed.data.sourcePage,
    adults: parsed.data.adults,
    infants: parsed.data.infants,
  };

  return {
    success: true,
    data: {
      ...data,
      email: data.email.toLowerCase(),
    },
  };
}

export function createWhatsAppLink({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  const normalizedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
