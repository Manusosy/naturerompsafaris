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

    console.log("Altering column 'category' in 'packages' table to varchar...");
    await client.query(`
        ALTER TABLE packages 
        ALTER COLUMN category TYPE varchar USING category::varchar;
    `);
    console.log("Column 'category' successfully altered to varchar!");

    await client.end();
}

run().catch(console.error);
