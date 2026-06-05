import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.text().catch(() => "");
  return NextResponse.json(
    { message: "Public registration is disabled. Ask an administrator to invite the account." },
    { status: 403 },
  );
}
