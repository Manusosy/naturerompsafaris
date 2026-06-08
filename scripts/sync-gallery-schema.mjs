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
CREATE TABLE IF NOT EXISTS gallery_rels (
  id serial PRIMARY KEY,
  "order" integer,
  parent_id integer NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
  path varchar NOT NULL,
  media_id integer REFERENCES media(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS gallery_rels_order_idx ON gallery_rels("order");
CREATE INDEX IF NOT EXISTS gallery_rels_parent_idx ON gallery_rels(parent_id);
CREATE INDEX IF NOT EXISTS gallery_rels_path_idx ON gallery_rels(path);

ALTER TABLE gallery ALTER COLUMN image_id DROP NOT NULL;

INSERT INTO gallery_rels (parent_id, path, media_id, "order")
SELECT g.id, 'images', g.image_id, 1
FROM gallery g
WHERE g.image_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM gallery_rels rel
    WHERE rel.parent_id = g.id
      AND rel.path = 'images'
      AND rel.media_id = g.image_id
  );

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-gallery-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-gallery-schema');
`;

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();

console.log("Gallery schema sync complete.");
