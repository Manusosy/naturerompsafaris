import { NextResponse } from "next/server";

import { validateSignupPassword } from "@/lib/portal-signup";
import { getPayloadClient, getPortalUser } from "@/lib/portal/data";
import { isTrustedPortalOrigin } from "@/lib/portal/security";

export async function POST(request: Request) {
  const user = await getPortalUser(request);
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isTrustedPortalOrigin(request)) {
    return NextResponse.json({ message: "Invalid request" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!firstName || !lastName) {
    return NextResponse.json({ message: "First name and second name are required." }, { status: 400 });
  }

  if (password) {
    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }
  }

  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
  };
  if (password) data.password = password;

  const result = await payload.update({
    collection: "users",
    data,
    id: user.id,
    overrideAccess: true,
  });

  return NextResponse.json({ result });
}
