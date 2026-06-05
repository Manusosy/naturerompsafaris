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
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE enum_gallery_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_testimonials_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_homepage_slides_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_faqs_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE gallery ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS status enum_gallery_status NOT NULL DEFAULT 'draft';

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS location varchar;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS avatar_id integer REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS status enum_testimonials_status NOT NULL DEFAULT 'draft';

CREATE TABLE IF NOT EXISTS homepage_slides (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  description varchar NOT NULL,
  image_id integer REFERENCES media(id) ON DELETE SET NULL,
  destination_focus varchar DEFAULT 'Kenya & Tanzania',
  cta_label varchar DEFAULT 'Plan My Safari',
  cta_href varchar DEFAULT '/contact',
  sort_order numeric DEFAULT 0,
  status enum_homepage_slides_status NOT NULL DEFAULT 'draft',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS homepage_slides_sort_order_idx ON homepage_slides(sort_order);
CREATE INDEX IF NOT EXISTS homepage_slides_status_idx ON homepage_slides(status);

CREATE TABLE IF NOT EXISTS faqs (
  id serial PRIMARY KEY,
  question varchar NOT NULL,
  answer varchar NOT NULL,
  category varchar DEFAULT 'Planning',
  featured boolean DEFAULT false,
  sort_order numeric DEFAULT 0,
  status enum_faqs_status NOT NULL DEFAULT 'draft',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS faqs_sort_order_idx ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS faqs_status_idx ON faqs(status);

ALTER TABLE payload_locked_documents_rels
  ADD COLUMN IF NOT EXISTS homepage_slides_id integer REFERENCES homepage_slides(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS faqs_id integer REFERENCES faqs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_homepage_slides_id_idx ON payload_locked_documents_rels(homepage_slides_id);
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_faqs_id_idx ON payload_locked_documents_rels(faqs_id);

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_description varchar DEFAULT 'Nature Romp Safaris crafts private and small-group Kenya and Tanzania safari adventures with clear planning, local expertise, and custom quotes.';

CREATE TABLE IF NOT EXISTS site_settings_hero_slides (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY,
  title varchar NOT NULL,
  description varchar NOT NULL,
  image_id integer REFERENCES media(id) ON DELETE SET NULL,
  cta_label varchar DEFAULT 'Plan My Safari',
  cta_href varchar DEFAULT '/contact',
  sort_order numeric DEFAULT 0,
  published boolean DEFAULT true
);
CREATE INDEX IF NOT EXISTS site_settings_hero_slides_order_idx ON site_settings_hero_slides(_order);
CREATE INDEX IF NOT EXISTS site_settings_hero_slides_parent_id_idx ON site_settings_hero_slides(_parent_id);

CREATE TABLE IF NOT EXISTS site_settings_homepage_faqs (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY,
  question varchar NOT NULL,
  answer varchar NOT NULL,
  category varchar,
  sort_order numeric DEFAULT 0,
  published boolean DEFAULT true
);
CREATE INDEX IF NOT EXISTS site_settings_homepage_faqs_order_idx ON site_settings_homepage_faqs(_order);
CREATE INDEX IF NOT EXISTS site_settings_homepage_faqs_parent_id_idx ON site_settings_homepage_faqs(_parent_id);

ALTER TABLE trips_experience_types ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES trips(id) ON DELETE CASCADE;
ALTER TABLE trips_experience_types ADD COLUMN IF NOT EXISTS "order" integer;
UPDATE trips_experience_types SET parent_id = COALESCE(parent_id, _parent_id) WHERE parent_id IS NULL;
UPDATE trips_experience_types SET "order" = COALESCE("order", _order) WHERE "order" IS NULL;
ALTER TABLE trips_experience_types ALTER COLUMN _parent_id DROP NOT NULL;
ALTER TABLE trips_experience_types ALTER COLUMN _order DROP NOT NULL;
CREATE INDEX IF NOT EXISTS trips_experience_types_parent_id_payload_idx ON trips_experience_types(parent_id);
CREATE INDEX IF NOT EXISTS trips_experience_types_order_payload_idx ON trips_experience_types("order");

DO $$
DECLARE
  rel_name text;
BEGIN
  FOREACH rel_name IN ARRAY ARRAY[
    'accommodations_amenities',
    'destinations_direct_answers',
    'destinations_faqs',
    'destinations_gallery',
    'packages_faqs',
    'site_settings_booking_security_items',
    'site_settings_hero_slides',
    'site_settings_homepage_faqs',
    'site_settings_partner_logos',
    'trips_destination_stops',
    'trips_direct_answers',
    'trips_excluded',
    'trips_experience_types',
    'trips_faqs',
    'trips_gallery',
    'trips_highlights',
    'trips_included',
    'trips_itinerary_days',
    'trips_price_seasons',
    'trips_route_waypoints',
    'trips_why_book'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = rel_name
        AND column_name = 'id'
        AND data_type = 'character varying'
    ) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text', rel_name);
    END IF;
  END LOOP;
END $$;

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'production-cms-redesign', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'production-cms-redesign');
`;

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();

console.log("Production CMS redesign schema migration complete.");
