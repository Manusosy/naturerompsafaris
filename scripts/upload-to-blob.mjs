import fs from "node:fs";
import path from "path";
import { put } from "@vercel/blob";

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

async function run() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set.");
    process.exit(1);
  }

  const mediaDir = path.join(process.cwd(), "public", "media");
  if (!fs.existsSync(mediaDir)) {
    console.error("public/media does not exist.");
    process.exit(1);
  }

  const files = fs.readdirSync(mediaDir);
  console.log(`Found ${files.length} files in public/media. Starting upload...`);

  let successCount = 0;
  let errorCount = 0;

  // We will upload them in batches of 5 to avoid rate limits/timeouts
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(mediaDir, file);
      try {
        const buffer = fs.readFileSync(filePath);
        // Upload with addRandomSuffix: false so the filename matches the DB exactly
        const blob = await put(file, buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
        });
        console.log(`Uploaded ${file} -> ${blob.url}`);
        successCount++;
      } catch (err) {
        console.error(`Error uploading ${file}:`, err.message);
        errorCount++;
      }
    }));
  }

  console.log(`Finished uploading. Success: ${successCount}, Errors: ${errorCount}`);
}

run();
