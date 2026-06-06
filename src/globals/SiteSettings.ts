import type { GlobalConfig } from "payload";

import { site } from "../content/site";
import { anyone, editorOrAdmin } from "../lib/access";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: anyone,
    update: editorOrAdmin,
  },
  admin: {
    group: "Portal",
  },
  fields: [
    { name: "siteName", type: "text", defaultValue: "Kenya Tanzania Safari Adventure" },
    { name: "companyName", type: "text", defaultValue: "Nature Romp Safaris" },
    { name: "primaryEmail", type: "email", defaultValue: "info@naturerompsafaris.com" },
    { name: "secondaryEmail", type: "email", defaultValue: "naturerompsafaris@gmail.com" },
    { name: "phone", type: "text", defaultValue: "+254 722 714812" },
    { name: "whatsapp", type: "text", defaultValue: "+254 722 714812" },
    { name: "address", type: "textarea" },
    { name: "facebook", type: "text" },
    { name: "instagram", type: "text" },
    { name: "twitter", type: "text" },
    { name: "youtube", type: "text" },
    { name: "tiktok", type: "text" },
    {
      name: "heroSlides",
      label: "Homepage hero slides",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea", required: true },
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "ctaLabel", type: "text", defaultValue: "Plan My Safari" },
        { name: "ctaHref", type: "text", defaultValue: "/contact" },
        { name: "sortOrder", type: "number", defaultValue: 0 },
        { name: "published", type: "checkbox", defaultValue: true },
      ],
    },
    {
      name: "homepageFaqs",
      label: "Homepage FAQs",
      type: "array",
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
        { name: "category", type: "text" },
        { name: "sortOrder", type: "number", defaultValue: 0 },
        { name: "published", type: "checkbox", defaultValue: true },
      ],
    },
    {
      name: "footerDescription",
      label: "Footer description",
      type: "textarea",
      defaultValue: site.footerDescription,
    },
    {
      name: "footerQuickLinks",
      label: "Footer quick links",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
      defaultValue: site.footerQuickLinks,
    },
    {
      name: "whatsappEnquiryMessage",
      label: "WhatsApp enquiry message",
      type: "textarea",
      defaultValue: `Hello ${site.company}, I would like to plan a ${site.name}.`,
    },
    { name: "reviewHeading", type: "text", defaultValue: "We Are Highly Recommended" },
    {
      name: "trustindexEmbed",
      label: "Trustindex embed code",
      type: "textarea",
    },
    {
      name: "bookingSecurityHeading",
      type: "text",
      defaultValue: "Our Partners and Booking Security",
    },
    {
      name: "bookingSecurityText",
      type: "textarea",
      defaultValue:
        "Plan with confidence through a registered safari operator. Final confirmations, accommodation availability, and supplier terms are shared clearly before any booking commitment.",
    },
    {
      name: "bookingSecurityItems",
      type: "array",
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "partnerLogos",
      type: "array",
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "alt", type: "text", required: true },
      ],
    },
  ],
};
