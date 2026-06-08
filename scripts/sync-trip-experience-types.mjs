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
    process.env[key] ||= value;
  }
}

const sql = `
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS custom_experience_types varchar;

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-trip-experience-types', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-trip-experience-types');
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
  console.log("Trip experience types schema synced.");
} catch (error) {
  console.error("Trip experience types schema sync failed:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
