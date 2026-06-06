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
DO $$ BEGIN
  CREATE TYPE enum_trips_budget_pricing_basis AS ENUM ('per-person', 'per-person-sharing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS budget_pricing_basis enum_trips_budget_pricing_basis
  DEFAULT 'per-person';

UPDATE trips
SET budget_pricing_basis = 'per-person'
WHERE budget_pricing_basis IS NULL;

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-trip-pricing-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-trip-pricing-schema');
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
  console.log("Trip pricing schema is ready.");
} catch (error) {
  console.error("Trip pricing schema sync failed.");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
