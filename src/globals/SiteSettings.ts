import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  fields: [
    { name: "siteName", type: "text", defaultValue: "Kenya Tanzania Safari Adventure" },
    { name: "companyName", type: "text", defaultValue: "Nature Romp Safaris" },
    { name: "primaryEmail", type: "email", defaultValue: "info@naturerompsafaris.com" },
    { name: "secondaryEmail", type: "email", defaultValue: "naturerompsafaris@gmail.com" },
    { name: "phone", type: "text", defaultValue: "+254 742637176" },
    { name: "whatsapp", type: "text", defaultValue: "+254 742637176" },
    { name: "address", type: "textarea" },
    { name: "facebook", type: "text" },
    { name: "instagram", type: "text" },
    { name: "twitter", type: "text" },
    { name: "youtube", type: "text" },
  ],
};
