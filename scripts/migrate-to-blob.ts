import { getPayload } from "payload";
import configPromise from "../src/payload.config";
import fs from "fs";
import path from "path";

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
  const payload = await getPayload({ config: configPromise });

  const mediaDocs = await payload.find({
    collection: "media",
    limit: 1000,
  });

  console.log(`Found ${mediaDocs.docs.length} media documents.`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of mediaDocs.docs) {
    if (doc.url && doc.url.startsWith("http")) {
      console.log(`Skipping ${doc.filename}, already has absolute URL`);
      continue;
    }

    const filePath = path.join(process.cwd(), "public", "media", String(doc.filename));
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${doc.filename}, file not found locally.`);
      continue;
    }

    console.log(`Uploading ${doc.filename}...`);
    try {
      const buffer = fs.readFileSync(filePath);
      
      await payload.update({
        collection: "media",
        id: doc.id,
        data: {
          alt: doc.alt
        },
        file: {
          data: buffer,
          name: doc.filename,
          mimetype: doc.mimeType,
          size: doc.filesize,
        },
      });
      console.log(`Successfully migrated ${doc.filename}`);
      successCount++;
    } catch (err) {
      console.error(`Failed to migrate ${doc.filename}:`, err);
      errorCount++;
    }
  }

  console.log(`Finished. Success: ${successCount}, Errors: ${errorCount}`);
  process.exit(0);
}

run();
