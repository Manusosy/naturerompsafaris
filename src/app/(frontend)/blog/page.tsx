import type { Metadata } from "next";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { BlogCard, type BlogSummary } from "@/components/Cards";
import { posts as staticPosts } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Travel Blog",
  description:
    "Kenya Tanzania safari guides covering cost, best time, itineraries, migration routes, Kenya adventure and Tanzania adventure planning.",
  path: "/blog",
  keywords: "Kenya Tanzania safari blog, safari cost, best time safari, Masai Mara Serengeti",
});

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "posts",
    where: { status: { equals: "published" } },
    sort: "-publishedAt",
    limit: 100,
    depth: 1,
    overrideAccess: true,
  });

  const posts = result.docs as unknown as BlogSummary[];

  return (
    <main className="travel-blog-page">
      <section className="travel-blog-hero">
        <div className="container">
          <h1>Travel Blog</h1>
          <p>
            Field-tested Kenya and Tanzania safari advice, East Africa route ideas,
            beach extensions, wildlife timing, and practical planning notes from Nature Romp Safaris.
          </p>
        </div>
      </section>
      <section className="travel-blog-section">
        <div className="container travel-blog-layout">
          <aside className="travel-blog-sidebar" aria-label="Travel blog filters">
            <form className="travel-blog-search">
              <label className="sr-only" htmlFor="travel-blog-search">Search travel blog</label>
              <input id="travel-blog-search" placeholder="Enter keyword" type="search" />
              <button type="submit" aria-label="Search blog">Search</button>
            </form>

          </aside>

          <div className="travel-blog-grid">
            {posts.map((item) => <BlogCard item={item} key={item.slug} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
