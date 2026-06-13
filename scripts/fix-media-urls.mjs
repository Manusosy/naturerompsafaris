import dns from "node:dns";
import fs from "node:fs";
import { Client } from "pg";
import { del, list } from "@vercel/blob";

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

loadLocalEnv();

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_STORE_ID = process.env.BLOB_STORE_ID;

if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN not set");
  process.exit(1);
}

async function run() {
  // 1. List all blobs currently in the store
  console.log("Fetching blobs from Vercel Blob store...");
  const blobList = await list({ token: BLOB_TOKEN });
  const blobUrls = new Set(blobList.blobs.map((b) => b.url));
  const blobByFilename = new Map(
    blobList.blobs.map((b) => [b.pathname, b.url])
  );
  console.log(`Found ${blobList.blobs.length} blobs in store.`);

  // 2. Check DB records
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query("SELECT id, filename, url FROM media ORDER BY id");
  console.log(`\nFound ${res.rows.length} media records in DB.\n`);

  let localCount = 0;
  let blobCount = 0;
  let missingCount = 0;

  for (const row of res.rows) {
    const isLocalUrl = row.url && row.url.startsWith("/api/media/");
    const isBlobUrl = row.url && row.url.includes("blob.vercel-storage.com");

    if (isBlobUrl) {
      blobCount++;
      continue;
    }

    if (isLocalUrl || !row.url) {
      localCount++;
      // Check if the filename exists in blob store
      const blobUrl = blobByFilename.get(row.filename);
      if (blobUrl) {
        // File is in blob, update the DB URL so the delete button works
        await client.query("UPDATE media SET url = $1 WHERE id = $2", [blobUrl, row.id]);
        console.log(`✅ Fixed DB URL for: ${row.filename} (id=${row.id})`);
      } else {
        missingCount++;
        console.log(`⚠️  No blob found for: ${row.filename} (id=${row.id}) — will stay as local ref`);
      }
    }
  }

  await client.end();

  console.log("\n--- Summary ---");
  console.log(`Already pointing to blob: ${blobCount}`);
  console.log(`Fixed (was local, now blob): ${localCount - missingCount}`);
  console.log(`Could not fix (no blob file): ${missingCount}`);
}

run().catch(console.error);
