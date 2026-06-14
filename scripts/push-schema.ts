import { getPayload } from "payload";
import configPromise from "../src/payload.config.js";

async function push() {
  try {
    process.env.PAYLOAD_DEV_SCHEMA_PUSH = "true";
    console.log("Initializing payload and pushing schema...");
    await getPayload({ config: configPromise });
    console.log("Schema pushed successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

push();
