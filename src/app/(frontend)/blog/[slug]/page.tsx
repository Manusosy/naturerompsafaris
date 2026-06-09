import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, ChevronRight, Share2, Tag } from "lucide-react";
import configPromise from "@payload-config";
import { getPayload } from "payload";

import { type BlogSummary } from "@/components/Cards";
import { BlogArticleTableOfContents } from "@/components/BlogArticleTableOfContents";
import { BlogRelatedCard } from "@/components/BlogRelatedCard";
import { buildBlogShareLinks } from "@/components/BlogShareIcons";
import { JsonLd } from "@/components/JsonLd";
import { posts, site } from "@/content/site";
import { articleTocItemListSchema, buildArticleToc } from "@/lib/article-toc";
import { normalizeMediaUrl } from "@/lib/cms-media";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { shouldSkipBuildTimePayload } from "@/lib/build-static-params";

type Props = { params: Promise<{ slug: string }> };

type CmsPost = {
  body?: string;
  category?: { name?: string; slug?: string } | string;
  excerpt?: string;
  image?: { alt?: string; url?: string } | string;
  imageCaption?: string;
  publishedAt?: string;
  seo?: {
    keywords?: string;
    metaDescription?: string;
    metaTitle?: string;
  };
  slug?: string;
  tags?: Array<{ name?: string; slug?: string } | string>;
  title?: string;
};

async function findCmsPost(slug: string): Promise<CmsPost | null> {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "posts",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      },
    });
    return (result.docs[0] as CmsPost | undefined) ?? null;
  } catch {
    return null;
  }
}

async function findRelatedPosts(slug: string, limit = 6) {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "posts",
      depth: 1,
      limit,
      overrideAccess: true,
      sort: "-publishedAt",
      where: {
        and: [{ status: { equals: "published" } }, { slug: { not_equals: slug } }],
      },
    });
    return result.docs as unknown as BlogSummary[];
  } catch {
    return [];
  }
}

function mediaUrl(image: CmsPost["image"], fallback: string) {
  if (image && typeof image === "object" && typeof image.url === "string") {
    return normalizeMediaUrl(image.url);
  }
  if (typeof image === "string") return normalizeMediaUrl(image);
  return fallback;
}

function mediaAlt(image: CmsPost["image"], fallback: string) {
  if (image && typeof image === "object" && typeof image.alt === "string") return image.alt;
  return fallback;
}

function relationName(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.title ?? "").trim();
  }
  return "";
}

function relationSlug(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return typeof record.slug === "string" ? record.slug : "";
  }
  return "";
}

function formatPublishedDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

const articleAuthor = "Yvonne A.";

export async function generateStaticParams() {
  if (shouldSkipBuildTimePayload()) return [];

  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "posts",
    depth: 0,
    limit: 100,
    overrideAccess: true,
  });
  return result.docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cmsPost = await findCmsPost(slug);
  const post = cmsPost ?? posts.find((item) => item.slug === slug);
  if (!post) return {};
  const seo = "seo" in post ? post.seo : undefined;
  return buildMetadata({
    title: seo?.metaTitle || post.title || "Safari article",
    description: seo?.metaDescription || post.excerpt || "",
    path: `/blog/${post.slug || slug}`,
    keywords: seo?.keywords || `${post.title}, Kenya Tanzania safari adventure`,
    image: mediaUrl(post.image, "/assets/img/blog1.jpg"),
  });
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const cmsPost = await findCmsPost(slug);
  const fallbackPost = posts.find((item) => item.slug === slug);
  const post = cmsPost ?? fallbackPost;
  if (!post) notFound();

  const image = mediaUrl(post.image, "/assets/img/blog1.jpg");
  const title = post.title || "Safari article";
  const excerpt = post.excerpt || "";
  const publishedLabel = formatPublishedDate(cmsPost?.publishedAt);
  const categoryName = relationName(cmsPost?.category);
  const articleUrl = `${site.canonicalUrl}/blog/${post.slug || slug}`;
  const shareLinks = buildBlogShareLinks(articleUrl, title);
  const tagItems = Array.isArray(cmsPost?.tags)
    ? cmsPost.tags.map((tag) => ({
        name: relationName(tag),
        slug: relationSlug(tag),
      })).filter((tag) => tag.name)
    : [];
  const relatedPosts = cmsPost ? await findRelatedPosts(slug) : [];
  const sanitizedBody = cmsPost?.body?.trim() ? sanitizeHtml(cmsPost.body.trim()) : "";
  const articleToc = sanitizedBody ? buildArticleToc(sanitizedBody) : null;

  return (
    <main className="blog-article-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          author: { "@type": "Organization", name: "Nature Romp Safaris", url: site.canonicalUrl },
          dateModified: cmsPost?.publishedAt,
          datePublished: cmsPost?.publishedAt,
          description: excerpt,
          headline: title,
          image: image.startsWith("http") ? image : `${site.canonicalUrl}${image}`,
          mainEntityOfPage: articleUrl,
          publisher: {
            "@type": "Organization",
            logo: {
              "@type": "ImageObject",
              url: `${site.canonicalUrl}/favicon.ico`,
            },
            name: "Nature Romp Safaris",
          },
        }}
      />
      {articleToc?.showToc ? (
        <JsonLd data={articleTocItemListSchema(articleToc.items, articleUrl)} />
      ) : null}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: title, url: `/blog/${post.slug || slug}` },
        ])}
      />

      <section className="blog-article-hero">
        <div className="container blog-article-hero__content">
          <nav aria-label="Breadcrumb" className="blog-article-breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight aria-hidden size={14} />
            <Link href="/blog">Travel Blog</Link>
            <ChevronRight aria-hidden size={14} />
            <span>{title}</span>
          </nav>
          <div className="blog-article-kickers">
            <span className="blog-article-hero__category">{categoryName || "Safari Guide"}</span>
            {tagItems.slice(0, 1).map((tag) => (
              <span className="blog-article-hero__category" key={tag.slug || tag.name}>
                {tag.name}
              </span>
            ))}
          </div>
          <h1>{title}</h1>
          <div className="blog-article-byline">
            <div className="blog-article-author" aria-label={`Article by ${articleAuthor}`}>
              <Image
                alt="Nature Romp Safaris"
                className="blog-article-author__avatar"
                height={58}
                src="/favicon.ico"
                unoptimized
                width={58}
              />
              <span className="blog-article-author__meta">
                <span>
                  By <strong>{articleAuthor}</strong>
                </span>
                {publishedLabel ? (
                  <span className="blog-article-hero__meta">
                    <CalendarDays aria-hidden size={15} />
                    Last updated: {publishedLabel}
                  </span>
                ) : (
                  <span className="blog-article-hero__meta">Nature Romp Safaris</span>
                )}
              </span>
            </div>
            <div className="blog-article-share blog-article-share--top" aria-label="Share article">
              <span className="blog-article-share__label">
                <Share2 aria-hidden size={15} />
                Share
              </span>
              <div className="blog-article-share__icons">
                {shareLinks.map((item) => (
                  <a
                    aria-label={item.label}
                    className={`blog-share-icon ${item.className}`}
                    href={item.href}
                    key={item.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-article-body">
        <div className="container blog-article-layout">
          <aside className="blog-article-share-rail" aria-label="Share article">
            <span>
              <Share2 aria-hidden size={18} />
              Share
            </span>
            <div className="blog-article-share-rail__icons">
              {shareLinks.map((item) => (
                <a
                  aria-label={item.label}
                  className={`blog-share-icon ${item.className}`}
                  href={item.href}
                  key={item.label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </aside>
          <article className="blog-article-main">
            <figure className="blog-article-featured">
              <Image
                alt={mediaAlt(post.image, title)}
                className="blog-article-featured__image"
                height={620}
                priority
                sizes="(max-width: 900px) 100vw, 780px"
                src={image}
                unoptimized
                width={960}
              />
              <figcaption>{cmsPost?.imageCaption || title}</figcaption>
            </figure>

            {excerpt ? <p className="blog-article-lead">{excerpt}</p> : null}

            {articleToc?.showToc ? <BlogArticleTableOfContents items={articleToc.items} /> : null}

            {sanitizedBody ? (
              <div
                className="blog-article-prose"
                dangerouslySetInnerHTML={{ __html: articleToc?.htmlWithIds ?? sanitizedBody }}
              />
            ) : (
              <div className="blog-article-prose">
                <p>
                  A strong Kenya Tanzania safari adventure begins with the right route. The best
                  itinerary considers season, wildlife movement, driving distance, border logistics,
                  accommodation style and the guest&apos;s appetite for adventure.
                </p>
                <p>
                  Nature Romp Safaris helps travelers compare Kenya adventure safaris, Tanzania
                  adventure safaris and combined routes so each journey balances wildlife, comfort
                  and value.
                </p>
              </div>
            )}

            {tagItems.length ? (
              <div className="blog-article-tags">
                <span className="blog-article-tags__label">
                  <Tag aria-hidden size={15} />
                  Tags
                </span>
                <div className="blog-article-tags__list">
                  {tagItems.map((tag) => (
                    <span className="blog-article-tag" key={tag.slug || tag.name}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="blog-article-actions">
              <Link className="blog-article-actions__back" href="/blog">
                ← Back to Travel Blog
              </Link>
              <Link className="blog-article-actions__cta" href="/contact">
                Plan your safari with us
              </Link>
            </div>
          </article>
        </div>
      </section>

      {relatedPosts.length ? (
        <section className="blog-article-related">
          <div className="container">
            <div className="blog-article-related__head">
              <div>
                <p className="blog-article-related__eyebrow">Keep exploring</p>
                <h2>More published articles</h2>
              </div>
              <Link href="/blog">View all articles</Link>
            </div>
            <div className="blog-related-grid">
              {relatedPosts.map((item) => (
                <BlogRelatedCard item={item} key={item.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
