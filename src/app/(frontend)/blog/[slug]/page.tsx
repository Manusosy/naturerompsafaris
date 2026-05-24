import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { posts, site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return posts.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: `${post.title}, Kenya Tanzania safari adventure`,
    image: post.image,
  });
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <main>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        author: { "@type": "Organization", name: site.company },
        image: `${site.canonicalUrl}${post.image}`,
      }} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: post.title, url: `/blog/${post.slug}` },
      ])} />
      <PageHero title={post.title} />
      <section className="content-page">
        <div className="container split">
          <article>
            <Image src={post.image} alt={post.title} width={900} height={540} />
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
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
            <div className="faq-grid">
              <article>
                <h3>What is the best route?</h3>
                <p>Masai Mara, Serengeti and Ngorongoro are ideal for classic combined safari intent, while Amboseli and Tarangire add strong scenery and elephant viewing.</p>
              </article>
              <article>
                <h3>How should travelers start?</h3>
                <p>Share travel dates, group size, preferred comfort level and whether Nairobi, Arusha or Zanzibar should be part of the route.</p>
              </article>
            </div>
          </article>
          <EnquiryForm subject={post.title} />
        </div>
      </section>
    </main>
  );
}
