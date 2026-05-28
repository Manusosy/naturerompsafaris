import { z } from "zod";

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(180),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(60).optional().or(z.literal("")),
  nationality: z.string().trim().max(120).optional().or(z.literal("")),
  destinationChoice: z.string().trim().max(180).optional().or(z.literal("")),
  subject: z.string().trim().max(180).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is required").max(3000),
  comments: z.string().trim().max(3000).optional().or(z.literal("")),
  sourcePage: z.string().trim().max(240).optional().or(z.literal("")),
  sourceTrip: z.string().trim().max(120).optional().or(z.literal("")),
  adults: z.string().trim().max(20).optional().or(z.literal("")),
  children: z.string().trim().max(20).optional().or(z.literal("")),
  infants: z.string().trim().max(20).optional().or(z.literal("")),
  travelDays: z.string().trim().max(60).optional().or(z.literal("")),
  tourStartDate: z.string().trim().max(60).optional().or(z.literal("")),
  startDate: z.string().trim().max(60).optional().or(z.literal("")),
  endDate: z.string().trim().max(60).optional().or(z.literal("")),
  flexibleDates: z.union([z.boolean(), z.string()]).optional(),
  budgetRange: z.string().trim().max(120).optional().or(z.literal("")),
  budgetPerPerson: z.string().trim().max(120).optional().or(z.literal("")),
  accommodationPreference: z.string().trim().max(120).optional().or(z.literal("")),
  planningStage: z.string().trim().max(160).optional().or(z.literal("")),
  tripType: z.string().trim().max(160).optional().or(z.literal("")),
  referralSource: z.string().trim().max(160).optional().or(z.literal("")),
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
    nationality: parsed.data.nationality,
    destinationChoice: parsed.data.destinationChoice,
    subject: parsed.data.subject,
    message: parsed.data.message,
    comments: parsed.data.comments,
    sourcePage: parsed.data.sourcePage,
    sourceTrip: parsed.data.sourceTrip,
    adults: parsed.data.adults,
    children: parsed.data.children,
    infants: parsed.data.infants,
    travelDays: parsed.data.travelDays,
    tourStartDate: parsed.data.tourStartDate,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    flexibleDates: parsed.data.flexibleDates === true || parsed.data.flexibleDates === "true" || parsed.data.flexibleDates === "on",
    budgetRange: parsed.data.budgetRange,
    budgetPerPerson: parsed.data.budgetPerPerson,
    accommodationPreference: parsed.data.accommodationPreference,
    planningStage: parsed.data.planningStage,
    tripType: parsed.data.tripType,
    referralSource: parsed.data.referralSource,
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
