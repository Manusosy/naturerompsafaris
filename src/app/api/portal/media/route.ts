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
  if (!formData) {
    return NextResponse.json({ message: "No data received." }, { status: 400 });
  }

  const files = formData.getAll("file");
  if (files.length === 0) {
    return NextResponse.json({ message: "At least one image file is required." }, { status: 400 });
  }

  const payload = await getPayloadClient();
  const results = [];
  const errors = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    // Use filename as default alt if not provided for bulk uploads
    const alt = String(formData.get("alt") || file.name).trim();
    const caption = String(formData.get("caption") || "").trim();

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      errors.push(`${file.name}: File is too large (max 10MB)`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await payload.create({
        collection: "media",
        data: { alt, caption },
        file: {
          data: buffer,
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
        overrideAccess: true,
      });
      results.push(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${file.name}: ${message}`);
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return NextResponse.json({ message: `Upload failed: ${errors.join(", ")}` }, { status: 400 });
  }

  return NextResponse.json({
    results,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? `Uploaded ${results.length} files with some errors.` : undefined
  });
}
