import { NextResponse } from "next/server";

import { getPayloadClient, getPortalUser } from "@/lib/portal/data";
import {
  canManagePortalCollection,
  canManagePortalGlobal,
  isTrustedPortalOrigin,
} from "@/lib/portal/security";

type PortalRecordRequest = {
  action?: "delete";
  collection?: string;
  data?: Record<string, unknown>;
  globalSlug?: string;
  id?: string;
};

export async function POST(request: Request) {
  const user = await getPortalUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isTrustedPortalOrigin(request)) {
    return NextResponse.json({ message: "Invalid request" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PortalRecordRequest | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const payload = await getPayloadClient();

  try {
    if (body.globalSlug) {
      if (!canManagePortalGlobal(user, body.globalSlug)) {
        return NextResponse.json({ message: "This action is not permitted." }, { status: 403 });
      }

      const result = await payload.updateGlobal({
        data: body.data ?? {},
        overrideAccess: true,
        slug: body.globalSlug as never,
      });
      return NextResponse.json({ result });
    }

    if (!body.collection) {
      return NextResponse.json({ message: "Collection is required" }, { status: 400 });
    }

    if (!canManagePortalCollection(user, body.collection)) {
      return NextResponse.json({ message: "This action is not permitted." }, { status: 403 });
    }

    if (body.action === "delete" && body.id) {
      const result = await payload.delete({
        collection: body.collection as never,
        id: body.id,
        overrideAccess: true,
      });
      return NextResponse.json({ result });
    }

    if (body.id) {
      const result = await payload.update({
        collection: body.collection as never,
        data: body.data ?? {},
        id: body.id,
        overrideAccess: true,
      });
      return NextResponse.json({ result });
    }

    const result = await payload.create({
      collection: body.collection as never,
      data: body.data ?? {},
      overrideAccess: true,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Portal record mutation failed", error);
    return NextResponse.json({ message: "Unable to save this record." }, { status: 400 });
  }
}
