import fs from "node:fs";
import { Client } from "pg";

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;
  const env = fs.readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ||= value;
  }
}

const sql = `
DO $$ BEGIN CREATE TYPE enum_accommodations_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE enum_accommodations_country AS ENUM ('kenya','tanzania');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE enum_accommodations_type ADD VALUE IF NOT EXISTS 'boutique';

ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS slug varchar;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS country enum_accommodations_country;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS youtube_url varchar;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS comfort_level varchar;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS status enum_accommodations_status NOT NULL DEFAULT 'draft';
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS seo_meta_title varchar;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS seo_meta_description varchar;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS seo_canonical_url varchar;

WITH base AS (
  SELECT
    id,
    NULLIF(regexp_replace(trim(lower(name)), '[^a-z0-9]+', '-', 'g'), '') AS base_slug
  FROM accommodations
  WHERE slug IS NULL OR slug = ''
),
numbered AS (
  SELECT
    id,
    COALESCE(base_slug, 'accommodation-' || id::text) AS base_slug,
    row_number() OVER (PARTITION BY COALESCE(base_slug, 'accommodation-' || id::text) ORDER BY id) AS duplicate_index
  FROM base
)
UPDATE accommodations a
SET slug = CASE
  WHEN numbered.duplicate_index = 1 THEN trim(both '-' FROM numbered.base_slug)
  ELSE trim(both '-' FROM numbered.base_slug) || '-' || numbered.duplicate_index::text
END
FROM numbered
WHERE a.id = numbered.id;

UPDATE accommodations
SET seo_canonical_url = 'https://kenyatanzaniasafariadventures.com/accommodations/' || slug
WHERE slug IS NOT NULL
  AND slug <> ''
  AND (seo_canonical_url IS NULL OR seo_canonical_url = '');

UPDATE accommodations
SET country = CASE
  WHEN lower(COALESCE(location, '')) LIKE '%tanzania%' THEN 'tanzania'::enum_accommodations_country
  ELSE 'kenya'::enum_accommodations_country
END
WHERE country IS NULL;

ALTER TABLE accommodations ALTER COLUMN country SET DEFAULT 'kenya'::enum_accommodations_country;
ALTER TABLE accommodations ALTER COLUMN country SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS accommodations_slug_idx ON accommodations(slug);
CREATE INDEX IF NOT EXISTS accommodations_country_idx ON accommodations(country);
CREATE INDEX IF NOT EXISTS accommodations_status_idx ON accommodations(status);
CREATE INDEX IF NOT EXISTS accommodations_price_idx ON accommodations(price);

ALTER TABLE payload_locked_documents_rels
  ADD COLUMN IF NOT EXISTS accommodations_id integer REFERENCES accommodations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_accommodations_id_idx
  ON payload_locked_documents_rels(accommodations_id);

CREATE TABLE IF NOT EXISTS accommodations_room_types (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY,
  room_type varchar NOT NULL
);
CREATE INDEX IF NOT EXISTS accommodations_room_types_order_idx ON accommodations_room_types(_order);
CREATE INDEX IF NOT EXISTS accommodations_room_types_parent_id_idx ON accommodations_room_types(_parent_id);

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-accommodation-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-accommodation-schema');
`;

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();

console.log("Accommodation schema sync complete.");
