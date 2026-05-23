import { NextResponse } from "next/server";

import { getPackageEnhancements } from "@/lib/portal-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const enhancements = await getPackageEnhancements(slug);

  return NextResponse.json(enhancements);
}
