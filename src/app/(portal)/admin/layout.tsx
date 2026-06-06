import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";

import "./portal.css";

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-portal",
});

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Nature Romp Safaris Portal",
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={jost.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
