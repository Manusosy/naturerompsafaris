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

    console.log("--- TABLE COLUMNS FOR 'packages' ---");
    const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'packages'
    ORDER BY ordinal_position;
  `);
    for (const col of cols.rows) {
        console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    }

    await client.end();
}

run().catch(console.error);

run().catch(console.error);
