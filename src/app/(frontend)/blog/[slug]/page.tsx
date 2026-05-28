import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import configPromise from "@payload-config";
import { getPayload } from "payload";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { posts, site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
type CmsPost = {
  body?: string;
  excerpt?: string;
  image?: { alt?: string; url?: string } | string;
  imageCaption?: string;
  keywords?: string;
  metaDescription?: string;
  metaTitle?: string;
  slug?: string;
  title?: string;
};
type BlogPostView = CmsPost & {
  excerpt?: string;
  image?: CmsPost["image"];
  slug?: string;
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
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
        ],
      },
    });
    return (result.docs[0] as CmsPost | undefined) ?? null;
  } catch {
    return null;
  }
}

function mediaUrl(image: CmsPost["image"], fallback: string) {
  if (image && typeof image === "object" && typeof image.url === "string") return image.url;
  if (typeof image === "string") return image;
  return fallback;
}

function mediaAlt(image: CmsPost["image"], fallback: string) {
  if (image && typeof image === "object" && typeof image.alt === "string") return image.alt;
  return fallback;
}

export async function generateStaticParams() {
  return posts.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cmsPost = await findCmsPost(slug);
  const post = (cmsPost ?? posts.find((item) => item.slug === slug)) as BlogPostView | undefined;
  if (!post) return {};
  return buildMetadata({
    title: post.metaTitle || post.title || "Safari article",
    description: post.metaDescription || post.excerpt || "",
    path: `/blog/${post.slug || slug}`,
    keywords: post.keywords || `${post.title}, Kenya Tanzania safari adventure`,
    image: mediaUrl(post.image, "/assets/img/blog1.jpg"),
  });
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const cmsPost = await findCmsPost(slug);
  const post = (cmsPost ?? posts.find((item) => item.slug === slug)) as BlogPostView | undefined;
  if (!post) notFound();
  const image = mediaUrl(post.image, "/assets/img/blog1.jpg");
  const title = post.title || "Safari article";
  const excerpt = post.excerpt || "";

  return (
    <main>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: excerpt,
        author: { "@type": "Organization", name: site.company },
        image: image.startsWith("http") ? image : `${site.canonicalUrl}${image}`,
      }} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: title, url: `/blog/${post.slug || slug}` },
      ])} />
      <PageHero title={title} />
      <section className="content-page">
        <div className="container split">
          <article>
            <Image src={image} alt={mediaAlt(post.image, title)} width={900} height={540} />
            {post.imageCaption ? <p className="image-caption">{post.imageCaption}</p> : null}
            <h2>{title}</h2>
            <p>{excerpt}</p>
            {cmsPost?.body ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: cmsPost.body }} />
            ) : (
              <>
                <p>
                  A strong Kenya Tanzania safari adventure begins with the right
                  route. The best itinerary considers season, wildlife movement,
                  driving distance, border logistics, accommodation style and the
                  guest&apos;s appetite for adventure.
                </p>
                <p>
                  Nature Romp Safaris helps travelers compare Kenya adventure
                  safaris, Tanzania adventure safaris and combined routes so each
                  journey balances wildlife, comfort and value.
                </p>
              </>
            )}
          </article>
          <EnquiryForm subject={title} />
        </div>
      </section>
    </main>
  );
}
