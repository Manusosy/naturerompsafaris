import type { Metadata } from "next";

import { BlogCard } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { posts } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Safari Blog",
  description:
    "Kenya Tanzania safari guides covering cost, best time, itineraries, migration routes, Kenya adventure and Tanzania adventure planning.",
  path: "/blog",
  keywords: "Kenya Tanzania safari blog, safari cost, best time safari, Masai Mara Serengeti",
});

export default function BlogPage() {
  return (
    <main>
      <PageHero title="Blog" />
      <section className="section">
        <div className="container card-grid">
          {posts.map((item) => <BlogCard item={item} key={item.slug} />)}
        </div>
      </section>
    </main>
  );
}
