import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { BlogCard, type BlogSummary } from "@/components/Cards";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Travel Blog",
  description:
    "Kenya Tanzania safari guides covering cost, best time, itineraries, migration routes, Kenya adventure and Tanzania adventure planning.",
  path: "/blog",
  keywords: "Kenya Tanzania safari blog, safari cost, best time safari, Masai Mara Serengeti",
});

type BlogSearchParams = {
  category?: string;
  q?: string;
};

type BlogCategory = {
  id?: string;
  name?: string;
  slug?: string;
};

type BlogListPost = BlogSummary & {
  body?: string;
  category?: BlogCategory | string;
};

function categoryName(value: BlogListPost["category"]) {
  if (value && typeof value === "object") return value.name || "Safari Guide";
  return typeof value === "string" ? value : "Safari Guide";
}

function categorySlug(value: BlogListPost["category"]) {
  if (value && typeof value === "object") return value.slug || "";
  return "";
}

function matchesSearch(post: BlogListPost, query: string) {
  if (!query) return true;
  const haystack = [post.title, post.excerpt, post.body, categoryName(post.category)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<BlogSearchParams>;
}) {
  const params = (await searchParams) || {};
  const activeCategory = params.category || "__all";
  const query = (params.q || "").trim();
  const payload = await getPayload({ config: configPromise });
  const [postsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: "posts",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: "post-categories",
      sort: "name",
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const allPosts = postsResult.docs as unknown as BlogListPost[];
  const categories = categoriesResult.docs as unknown as BlogCategory[];
  const categoryCounts = new Map<string, number>();
  allPosts.forEach((post) => {
    const slug = categorySlug(post.category);
    if (slug) categoryCounts.set(slug, (categoryCounts.get(slug) || 0) + 1);
  });
  const visibleCategories = categories.filter((category) => {
    const slug = category.slug || "";
    return categoryCounts.has(slug) || activeCategory === slug;
  });
  const posts = allPosts.filter((post) => {
    const categoryMatches =
      activeCategory === "__all" || categorySlug(post.category) === activeCategory;
    return categoryMatches && matchesSearch(post, query);
  });
  const isFiltered = activeCategory !== "__all" || query.length > 0;

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
            <form action="/blog" className="travel-blog-filter-form" method="get">
              <div className="travel-blog-filter-group">
                <h2 className="travel-blog-filter-heading">Search Articles</h2>
                <div className="travel-blog-search">
                  <label className="sr-only" htmlFor="travel-blog-search">Search travel blog</label>
                  <input
                    defaultValue={query}
                    id="travel-blog-search"
                    name="q"
                    placeholder="Safari cost, migration, Mara..."
                    type="search"
                  />
                  <button type="submit" aria-label="Search blog">Search</button>
                </div>
              </div>

              <div className="travel-blog-filter-group">
                <h2 className="travel-blog-filter-heading">Categories</h2>
                <label className="travel-blog-filter-radio">
                  <input
                    defaultChecked={activeCategory === "__all"}
                    name="category"
                    type="radio"
                    value="__all"
                  />
                  <span>All Articles</span>
                </label>
                {visibleCategories.map((category) => (
                  <label className="travel-blog-filter-radio" key={category.slug || category.id || category.name}>
                    <input
                      defaultChecked={activeCategory === category.slug}
                      name="category"
                      type="radio"
                      value={category.slug || ""}
                    />
                    <span>
                      {category.name}
                      {category.slug ? <small>{categoryCounts.get(category.slug) || 0}</small> : null}
                    </span>
                  </label>
                ))}
              </div>

              <button className="travel-blog-filter-btn" type="submit">Apply Filters</button>
              {isFiltered ? (
                <Link className="travel-blog-filter-clear" href="/blog">
                  Clear all filters
                </Link>
              ) : null}
            </form>

          </aside>

          <section className="travel-blog-results" aria-label="Travel blog articles">
            <div className="travel-blog-results__header">
              <p>
                {posts.length} {posts.length === 1 ? "article" : "articles"} found
              </p>
              {isFiltered ? (
                <span>
                  {query ? `Search: "${query}"` : null}
                  {query && activeCategory !== "__all" ? " / " : null}
                  {activeCategory !== "__all"
                    ? `Category: ${visibleCategories.find((category) => category.slug === activeCategory)?.name || activeCategory}`
                    : null}
                </span>
              ) : null}
            </div>

            {posts.length === 0 ? (
              <div className="travel-blog-empty">
                <p>No articles match your filters.</p>
                <Link href="/blog">View all articles</Link>
              </div>
            ) : (
              <div className="travel-blog-grid">
                {posts.map((item) => <BlogCard item={item} key={item.slug} />)}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
