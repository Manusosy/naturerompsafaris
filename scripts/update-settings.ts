import { getPayload } from "payload";
import configPromise from "../src/payload.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function loadLocalEnv() {
    const envPath = path.resolve(dirname, "../.env.local");
    if (!fs.existsSync(envPath)) return;
    const env = fs.readFileSync(envPath, "utf8");
    for (const line of env.split(/\r?\n/)) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
    }
}

async function run() {
    console.log("Loading local environment variables...");
    loadLocalEnv();

    if (!process.env.DATABASE_URL) {
        console.error("Error: DATABASE_URL is not defined in .env.local");
        process.exit(1);
    }

    console.log("Initializing Payload...");
    const payload = await getPayload({ config: configPromise });

    console.log("Updating Site Settings...");
    try {
        await payload.updateGlobal({
            slug: "site-settings" as never,
            data: {
                primaryEmail: "info@naturerompsafaris.com",
                phone: "+254 722 714812 / +254 739 206698",
                whatsapp: "+254 722 714812",
            },
            overrideAccess: true,
        });
        console.log("Successfully updated site-settings.");
    } catch (e) {
        console.error("Failed to update site-settings", e);
    }

    process.exit(0);
}

run();
