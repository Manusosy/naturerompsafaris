import { NextResponse } from "next/server";

import { getPayloadClient, getPortalUser } from "@/lib/portal/data";
import { canManagePortalCollection, isTrustedPortalOrigin } from "@/lib/portal/security";

export async function POST(request: Request) {
  const user = await getPortalUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManagePortalCollection(user, "media") || !isTrustedPortalOrigin(request)) {
    return NextResponse.json({ message: "This action is not permitted." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Image file is required." }, { status: 400 });
  }

  const alt = String(formData?.get("alt") ?? "").trim();
  if (!alt) {
    return NextResponse.json({ message: "Alt text is required." }, { status: 400 });
  }

  const payload = await getPayloadClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await payload.create({
      collection: "media",
      data: {
        alt,
        caption: String(formData?.get("caption") ?? "").trim(),
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Portal media upload failed", error);
    return NextResponse.json({ message: "Unable to upload this image." }, { status: 400 });
  }
}
