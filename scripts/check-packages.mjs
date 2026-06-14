import fs from "node:fs";
import { Client } from "pg";

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
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    console.log("--- PUBLISHED PACKAGES IN DATABASE ---");
    const res = await client.query(`
        SELECT id, title, slug, category, duration
        FROM packages
        ORDER BY id;
    `);
    for (const row of res.rows) {
        console.log(`ID: ${row.id} | Slug: ${row.slug} | Title: ${row.title}`);
    }

    await client.end();
}

run().catch(console.error);
