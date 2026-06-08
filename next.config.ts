import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const siteHostname = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : "kenyatanzaniasafariadventures.com";
const portalHostname = process.env.PORTAL_HOST || "portal.kenyatanzaniasafariadventures.com";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "duencyitservices.in",
      },
      {
        protocol: "https",
        hostname: siteHostname,
      },
      {
        protocol: "https",
        hostname: portalHostname,
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/about.html",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact.html",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/blog.html",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/travel-blog",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/blog-details.html",
        destination: "/blog/why-choose-east-africa-tour-operators",
        permanent: true,
      },
      {
        source: "/package-listing.html",
        destination: "/safari-packages",
        permanent: true,
      },
      {
        source: "/photo-gallary.html",
        destination: "/photo-gallery",
        permanent: true,
      },
      {
        source: "/tour-details.html",
        destination: "/safari-packages",
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig);
