import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { resendAdapter } from "@payloadcms/email-resend";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Accommodations } from "./collections/Accommodations";
import { ArticleTags } from "./collections/ArticleTags";
import { Bookings } from "./collections/Bookings";
import { Destinations } from "./collections/Destinations";
import { Enquiries } from "./collections/Enquiries";
import { Faqs } from "./collections/Faqs";
import { Gallery } from "./collections/Gallery";
import { HomepageSlides } from "./collections/HomepageSlides";
import { Itineraries } from "./collections/Itineraries";
import { Media } from "./collections/Media";
import { NavigationItems } from "./collections/NavigationItems";
import { Packages } from "./collections/Packages";
import { PostCategories } from "./collections/PostCategories";
import { Posts } from "./collections/Posts";
import { Testimonials } from "./collections/Testimonials";
import { Trips } from "./collections/Trips";
import { Users } from "./collections/Users";
import { FlightAffiliateSettings } from "./globals/FlightAffiliateSettings";
import { SiteSettings } from "./globals/SiteSettings";
import { getEnv } from "./lib/env";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const env = getEnv();

function emailAdapter() {
  if (env.hasSmtpProvider) {
    return nodemailerAdapter({
      defaultFromAddress: env.getEmailFromAddress(),
      defaultFromName: env.getEmailFromName(),
      transportOptions: {
        auth: {
          pass: env.getSmtpPassword(),
          user: env.SMTP_USER,
        },
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
      },
    });
  }

  if (env.getResendApiKey()) {
    return resendAdapter({
      apiKey: env.getResendApiKey() ?? "",
      defaultFromAddress: env.getEmailFromAddress(),
      defaultFromName: env.getEmailFromName(),
    });
  }

  return undefined;
}

export default buildConfig({
  routes: {
    admin: "/cms-admin",
  },
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "- Nature Romp Safaris CMS",
      icons: [{ rel: "icon", url: "/favicon.ico" }],
    },
  },
  collections: [
    Users,
    Media,
    NavigationItems,
    Destinations,
    Packages,
    Itineraries,
    Trips,
    PostCategories,
    ArticleTags,
    Posts,
    HomepageSlides,
    Faqs,
    Gallery,
    Testimonials,
    Enquiries,
    Bookings,
    Accommodations,
  ],
  globals: [SiteSettings, FlightAffiliateSettings],
  email: emailAdapter(),
  serverURL: env.PAYLOAD_SERVER_URL,
  sharp,
  secret: env.getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    push: env.PAYLOAD_DEV_SCHEMA_PUSH,
    pool: {
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 30_000,
      idleTimeoutMillis: 30_000,
      max: 5,
    },
  }),
});
