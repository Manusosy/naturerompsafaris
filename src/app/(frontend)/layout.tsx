import type { Metadata } from "next";
import { Open_Sans, Playfair_Display } from "next/font/google";
import "../globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ScrollAnimations } from "@/components/ScrollAnimations";
import { Analytics } from "@vercel/analytics/next";
import { organizationSchema } from "@/lib/seo";
import { site } from "@/content/site";
import { getPublishedDestinationsForNav } from "@/lib/public-destinations";
import { getPublicNavigation } from "@/lib/public-navigation";
import { getPublicSiteSettings } from "@/lib/public-site-settings";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
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
  const [navItems, siteSettings, destinations] = await Promise.all([
    getPublicNavigation(),
    getPublicSiteSettings(),
    getPublishedDestinationsForNav(),
  ]);
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${playfairDisplay.variable}`}
    >
      <body>
        <JsonLd data={organizationSchema()} />
        <ScrollAnimations />
        <Header destinations={destinations} navItems={navItems} siteSettings={siteSettings} />
        {children}
        <Footer navItems={navItems} siteSettings={siteSettings} />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
