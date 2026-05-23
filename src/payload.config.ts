import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Accommodations } from "@/collections/Accommodations";
import { Bookings } from "@/collections/Bookings";
import { Enquiries } from "@/collections/Enquiries";
import { Gallery } from "@/collections/Gallery";
import { Itineraries } from "@/collections/Itineraries";
import { Media } from "@/collections/Media";
import { Packages } from "@/collections/Packages";
import { Posts } from "@/collections/Posts";
import { Testimonials } from "@/collections/Testimonials";
import { Users } from "@/collections/Users";
import { FlightAffiliateSettings } from "@/globals/FlightAffiliateSettings";
import { SiteSettings } from "@/globals/SiteSettings";
import { getEnv } from "@/lib/env";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const env = getEnv();

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "- Nature Romp Safaris Portal",
      icons: [{ rel: "icon", url: "/favicon.ico" }],
    },
  },
  collections: [
    Users,
    Media,
    Packages,
    Itineraries,
    Posts,
    Gallery,
    Testimonials,
    Enquiries,
    Bookings,
    Accommodations,
  ],
  globals: [SiteSettings, FlightAffiliateSettings],
  editor: lexicalEditor(),
  secret: env.getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),
});
