import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "duencyitservices.in",
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
