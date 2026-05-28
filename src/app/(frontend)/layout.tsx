import type { Metadata } from "next";
import { Merriweather, Nunito } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { organizationSchema } from "@/lib/seo";
import { site } from "@/content/site";
import { getPublicNavigation } from "@/lib/public-navigation";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.canonicalUrl),
  title: {
    default: "Kenya Tanzania Safari Adventure | Nature Romp Safaris",
    template: "%s | Nature Romp Safaris",
  },
  description:
    "Plan Kenya Tanzania safari adventures, Kenya adventure safaris, Tanzania adventure safaris, Masai Mara Serengeti routes and custom East Africa tours with Nature Romp Safaris.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = await getPublicNavigation();
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${merriweather.variable}`}
    >
      <body>
        <JsonLd data={organizationSchema()} />
        <Header navItems={navItems} />
        {children}
        <Footer navItems={navItems} />
      </body>
    </html>
  );
}
