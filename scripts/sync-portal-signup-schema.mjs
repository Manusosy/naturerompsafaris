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
CREATE TABLE IF NOT EXISTS portal_signup_verifications (
  id serial PRIMARY KEY,
  email varchar NOT NULL,
  code_hash varchar NOT NULL,
  expires_at timestamp(3) with time zone NOT NULL,
  attempts numeric DEFAULT 0 NOT NULL,
  request_ip_hash varchar,
  created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
  updated_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS portal_signup_verifications_email_idx
  ON portal_signup_verifications(email);
CREATE INDEX IF NOT EXISTS portal_signup_verifications_expires_at_idx
  ON portal_signup_verifications(expires_at);
CREATE INDEX IF NOT EXISTS portal_signup_verifications_request_ip_hash_idx
  ON portal_signup_verifications(request_ip_hash);
CREATE INDEX IF NOT EXISTS portal_signup_verifications_created_at_idx
  ON portal_signup_verifications(created_at);

ALTER TABLE payload_locked_documents_rels
  ADD COLUMN IF NOT EXISTS portal_signup_verifications_id integer
  REFERENCES portal_signup_verifications(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_portal_signup_verifications_id_idx
  ON payload_locked_documents_rels(portal_signup_verifications_id);

INSERT INTO payload_migrations(name, batch, updated_at, created_at)
SELECT 'sync-portal-signup-schema', 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = 'sync-portal-signup-schema');
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
  console.log("Portal signup verification schema is ready.");
} catch (error) {
  console.error("Portal signup schema sync failed.");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
