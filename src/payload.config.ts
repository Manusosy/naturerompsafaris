import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Gallery } from "@/collections/Gallery";
import { Media } from "@/collections/Media";
import { Packages } from "@/collections/Packages";
import { Posts } from "@/collections/Posts";
import { Testimonials } from "@/collections/Testimonials";
import { Users } from "@/collections/Users";
import { SiteSettings } from "@/globals/SiteSettings";
import { getEnv } from "@/lib/env";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const env = getEnv();

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Packages, Posts, Gallery, Testimonials],
  globals: [SiteSettings],
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
