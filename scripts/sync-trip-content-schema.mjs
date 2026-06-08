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
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

const sql = `
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS card_summary varchar,
  ADD COLUMN IF NOT EXISTS departure_point varchar,
  ADD COLUMN IF NOT EXISTS accommodation_summary varchar,
  ADD COLUMN IF NOT EXISTS best_time_to_visit varchar;

ALTER TABLE trips_price_seasons
  ADD COLUMN IF NOT EXISTS party_size_label varchar,
  ADD COLUMN IF NOT EXISTS package_label varchar;

CREATE TABLE IF NOT EXISTS trips_optional_experiences (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title varchar,
  description varchar,
  price_note varchar
);
CREATE INDEX IF NOT EXISTS trips_optional_experiences_order_idx ON trips_optional_experiences(_order);
CREATE INDEX IF NOT EXISTS trips_optional_experiences_parent_id_idx ON trips_optional_experiences(_parent_id);

CREATE TABLE IF NOT EXISTS trips_accommodation_options (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name varchar,
  note varchar
);
CREATE INDEX IF NOT EXISTS trips_accommodation_options_order_idx ON trips_accommodation_options(_order);
CREATE INDEX IF NOT EXISTS trips_accommodation_options_parent_id_idx ON trips_accommodation_options(_parent_id);

CREATE TABLE IF NOT EXISTS trips_best_for (
  _order integer NOT NULL,
  _parent_id integer NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item varchar
);
CREATE INDEX IF NOT EXISTS trips_best_for_order_idx ON trips_best_for(_order);
CREATE INDEX IF NOT EXISTS trips_best_for_parent_id_idx ON trips_best_for(_parent_id);

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-trip-content-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-trip-content-schema');
`;

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 30_000,
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Trip content schema is ready.");
} catch (error) {
  console.error("Trip content schema sync failed.");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
