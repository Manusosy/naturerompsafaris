import dns from "node:dns";
import fs from "node:fs";
import { Client } from "pg";

dns.setDefaultResultOrder("ipv4first");

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;
  const env = fs.readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const sql = `
ALTER TABLE homepage_slides
  ADD COLUMN IF NOT EXISTS slide_interval_seconds numeric DEFAULT 6,
  ADD COLUMN IF NOT EXISTS background_video_url varchar;

ALTER TABLE homepage_slides ALTER COLUMN image_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS homepage_slides_rels (
  id serial PRIMARY KEY,
  "order" integer,
  parent_id integer NOT NULL REFERENCES homepage_slides(id) ON DELETE CASCADE,
  path varchar NOT NULL,
  media_id integer REFERENCES media(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS homepage_slides_rels_order_idx ON homepage_slides_rels("order");
CREATE INDEX IF NOT EXISTS homepage_slides_rels_parent_idx ON homepage_slides_rels(parent_id);
CREATE INDEX IF NOT EXISTS homepage_slides_rels_path_idx ON homepage_slides_rels(path);

INSERT INTO homepage_slides_rels (parent_id, path, media_id, "order")
SELECT hs.id, 'images', hs.image_id, 1
FROM homepage_slides hs
WHERE hs.image_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM homepage_slides_rels rel
    WHERE rel.parent_id = hs.id
      AND rel.path = 'images'
      AND rel.media_id = hs.image_id
  );

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-homepage-slides-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-homepage-slides-schema');
`;

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();

console.log("Homepage slides schema sync complete.");
