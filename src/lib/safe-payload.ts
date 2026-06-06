import configPromise from "@payload-config";
import { getPayload, type Payload } from "payload";

export async function getSafePayload(): Promise<Payload | null> {
  try {
    return await getPayload({ config: configPromise });
  } catch (error) {
    console.error("[payload] Failed to initialize Payload:", error);
    return null;
  }
}
