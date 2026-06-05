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

const navigationItems = [
  ["Home", "", "/", 10, false],
  ["About Us", "", "/about", 20, false],
  ["Destinations", "", "/destinations", 30, false],
  ["Kenya", "Destinations", "/destinations?country=Kenya", 31, false],
  ["Tanzania", "Destinations", "/destinations?country=Tanzania", 32, false],
  ["Zanzibar", "Destinations", "/destinations/zanzibar", 33, false],
  ["East Africa / Combined Safaris", "Destinations", "/destinations?region=East%20Africa", 34, false],
  ["Safari Tours", "", "/trips", 40, false],
  ["Kenya Safaris", "Safari Tours", "/safari-packages?category=Kenya%20Safaris", 41, false],
  ["Tanzania Safaris", "Safari Tours", "/safari-packages?category=Tanzania%20Safaris", 42, false],
  ["Kenya & Tanzania Safaris", "Safari Tours", "/safari-packages?category=Kenya%20Tanzania%20Combined%20Safaris", 43, false],
  ["Mount Kenya Climbing", "Safari Tours", "/safari-packages?group=mount-kenya-climbing", 44, false],
  ["Mount Kilimanjaro Climbing", "Safari Tours", "/safari-packages?group=kilimanjaro-climbing", 45, false],
  ["Safari & Beach Holidays", "Safari Tours", "/safari-packages?group=beach-extension", 46, false],
  ["Packages", "", "/safari-packages", 50, false],
  ["Budget", "Packages", "/safari-packages?tier=budget", 51, false],
  ["Mid Range", "Packages", "/safari-packages?tier=mid-range", 52, false],
  ["Luxury", "Packages", "/safari-packages?tier=luxury", 53, false],
  ["High End", "Packages", "/safari-packages?tier=high-end", 54, false],
  ["Experiences", "", "/safari-packages", 60, false],
  ["Family Safaris", "Experiences", "/safari-packages?experience=family", 61, false],
  ["Honeymoon Safaris", "Experiences", "/safari-packages?experience=honeymoon", 62, false],
  ["Group Joining Safaris", "Experiences", "/safari-packages?group=group-joining", 63, false],
  ["Private Safaris", "Experiences", "/safari-packages?experience=private", 64, false],
  ["Fly-In Safaris", "Experiences", "/safari-packages?group=kenya-fly-in", 65, false],
  ["Beach Extensions", "Experiences", "/safari-packages?group=beach-extension", 66, false],
  ["Contact", "", "/contact", 80, false],
  ["Request Quote", "", "/contact", 90, true],
];

const legacyNavigationKeys = [
  "::Kenya Safaris",
  "Kenya Safaris::Mount Kenya Climbing",
  "Kenya Safaris::Nairobi Excursion",
  "Kenya Safaris::Day Trips",
  "Kenya Safaris::Economy Private Safaris",
  "Kenya Safaris::Group Joining Safaris",
  "Kenya Safaris::Kenya Lodge Safaris",
  "Kenya Safaris::Kenya Fly In Safaris",
  "Kenya Safaris::Beach Extension",
  "Kenya Safaris::4x4 Safaris",
  "Kenya Safaris::Short Safaris",
  "::Tanzania Safaris",
  "Tanzania Safaris::Mount Kilimanjaro Climbing",
  "Tanzania Safaris::Tanzania Lodge Safaris",
  "Tanzania Safaris::Tanzania Budget Camping Safaris",
  "::Kenya & Tanzania Safaris",
  "Kenya & Tanzania Safaris::Kenya & Tanzania Lodge Safaris",
  "Kenya & Tanzania Safaris::Private Economy Safaris",
  "Kenya & Tanzania Safaris::Group Joining Safaris",
  "Kenya & Tanzania Safaris::Combined Lodge Safari",
  "Kenya & Tanzania Safaris::Combined Budget Safari",
  "::Book Now",
];

const schemaSql = `
DO $$ BEGIN CREATE TYPE enum_trips_package_tier AS ENUM ('budget','mid-range','luxury','high-end');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_trips_experience_types AS ENUM ('family','honeymoon','group-joining','private','fly-in','safari-beach','beach-extension','mount-climbing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_trips_price_seasons_tier AS ENUM ('budget','mid-range','luxury','high-end');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_packages_package_tier AS ENUM ('budget','mid-range','luxury','high-end');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hero_eyebrow varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hero_image_id integer;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hero_video_url varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_label varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS package_tier enum_trips_package_tier;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS quote_intro varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trustindex_embed_override varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS latitude varchar;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS longitude varchar;
CREATE TABLE IF NOT EXISTS trips_experience_types (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  value enum_trips_experience_types,
  id varchar PRIMARY KEY
);
CREATE INDEX IF NOT EXISTS trips_experience_types_order_idx ON trips_experience_types(_order);
CREATE INDEX IF NOT EXISTS trips_experience_types_parent_id_idx ON trips_experience_types(_parent_id);
ALTER TABLE trips_price_seasons ADD COLUMN IF NOT EXISTS tier enum_trips_price_seasons_tier;
ALTER TABLE trips_price_seasons ADD COLUMN IF NOT EXISTS currency varchar;
ALTER TABLE trips_price_seasons ADD COLUMN IF NOT EXISTS min numeric;
ALTER TABLE trips_price_seasons ADD COLUMN IF NOT EXISTS max numeric;
ALTER TABLE trips_price_seasons ADD COLUMN IF NOT EXISTS display_text varchar;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_tier enum_packages_package_tier;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS booking_security_heading varchar;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS booking_security_text varchar;
CREATE TABLE IF NOT EXISTS site_settings_booking_security_items (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY,
  item varchar
);
CREATE INDEX IF NOT EXISTS site_settings_booking_security_items_order_idx ON site_settings_booking_security_items(_order);
CREATE INDEX IF NOT EXISTS site_settings_booking_security_items_parent_id_idx ON site_settings_booking_security_items(_parent_id);
CREATE TABLE IF NOT EXISTS site_settings_partner_logos (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY,
  image_id integer,
  alt varchar
);
CREATE INDEX IF NOT EXISTS site_settings_partner_logos_order_idx ON site_settings_partner_logos(_order);
CREATE INDEX IF NOT EXISTS site_settings_partner_logos_parent_id_idx ON site_settings_partner_logos(_parent_id);
`;

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(schemaSql);

const existing = await client.query("select id, label, parent_label from navigation_items");
const byKey = new Map(existing.rows.map((row) => [`${row.parent_label || ""}::${row.label}`, row.id]));

for (const [label, parent, customUrl, sortOrder, primary] of navigationItems) {
  const key = `${parent}::${label}`;
  const id = byKey.get(key);
  if (id) {
    await client.query(
      "update navigation_items set custom_url=$1, sort_order=$2, visible=true, is_primary_action=$3, link_type='custom-url', updated_at=now() where id=$4",
      [customUrl, sortOrder, primary, id],
    );
  } else {
    await client.query(
      "insert into navigation_items(label,parent_label,link_type,custom_url,sort_order,visible,is_primary_action,updated_at,created_at) values($1,$2,'custom-url',$3,$4,true,$5,now(),now())",
      [label, parent || null, customUrl, sortOrder, primary],
    );
  }
}

await client.query(
  "update navigation_items set visible=false, is_primary_action=false, updated_at=now() where coalesce(parent_label,'') || '::' || label = any($1::text[])",
  [legacyNavigationKeys],
);

await client.end();
console.log("Flash trip schema and navigation sync complete.");
