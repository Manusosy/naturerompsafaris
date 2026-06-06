import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Gem, MapPinned, ShieldCheck } from "lucide-react";

import { EnquiryForm } from "@/components/EnquiryForm";
import { PackageCard, type BlogSummary, type Package } from "@/components/Cards";
import { HomepageFaqsExperience } from "@/components/HomepageFaqsExperience";
import { posts as staticPosts, serviceCards } from "@/content/site";
import { mediaAlt, mediaUrl } from "@/lib/cms-media";
import { getSafePayload } from "@/lib/safe-payload";

const serviceDetails: Record<string, { body: string; cta: string; href: string }> = {
  "Tours and Travel": {
    body: "Private Kenya and Tanzania safari routes planned around dates, comfort level, wildlife seasons and group pace.",
    cta: "View safari tours",
    href: "/safari-packages",
  },
  "Beach Safaris": {
    body: "Zanzibar and coast extensions paired with safari itineraries for a smoother bush-to-beach holiday.",
    cta: "Plan beach extension",
    href: "/safari-packages?group=beach-extension",
  },
  "Mountain Climbing": {
    body: "Guided Mount Kenya and Kilimanjaro climbs with clear route planning, equipment notes and acclimatization advice.",
    cta: "Explore climbs",
    href: "/safari-packages?group=mountain-climbing",
  },
  "Short Trips and Excursions": {
    body: "Day trips and short breaks from Nairobi or the coast for travelers with limited time.",
    cta: "See short trips",
    href: "/trips",
  },
};

export function SectionHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="section-head">
      {eyebrow && <p>{eyebrow}</p>}
      <h2>{title}</h2>
    </div>
  );
}

export function AboutPreview() {
  return (
    <section className="section about-preview">
      <div className="container">
        <SectionHeader title="Nature Romp Safaris | Who We Are" />
        <div className="split about-preview__split">
          <div>
          <p>
            Nature Romp Safaris is a trusted East African travel company crafting
            personalized Kenya Tanzania safari adventures, wildlife holidays,
            beach extensions, mountain climbing trips and private safari
            itineraries.
          </p>
          <p>
            Our team focuses on clear communication, reliable transport, local
            expertise and smooth travel planning from Nairobi to the region&apos;s
            most iconic parks.
          </p>
          <Link className="btn btn--outline" href="/about">Read More <ArrowRight size={16} /></Link>
          </div>
          <div className="image-stack">
          <Image src="/assets/img/about.jpg" alt="Nature Romp Safaris team and safari planning" width={720} height={520} />
          <Image src="/assets/img/about-small.webp" alt="Kenya safari vehicle" width={260} height={190} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section className="section services">
      <div className="container">
        <SectionHeader title="Our Services and Products" />
        <div className="services-layout">
          <div className="service-grid">
            {serviceCards.map(([title, image]) => {
              const detail = serviceDetails[title] ?? {
                body: "Tailored safari planning with clear advice before you commit.",
                cta: "Explore options",
                href: "/safari-packages",
              };

              return (
            <article className="service-card" key={title}>
              <Image src={image} alt={title} width={560} height={390} />
              <div className="service-card__content">
                <h3>{title}</h3>
                <p>{detail.body}</p>
                <Link href={detail.href}>{detail.cta}</Link>
              </div>
            </article>
              );
            })}
          </div>
          <EnquiryForm subject="Safari enquiry" />
        </div>
      </div>
    </section>
  );
}

export async function FeaturedPackages({ limit = 6 }: { limit?: number }) {
  let packages: Package[] = [];

  try {
    const payload = await getSafePayload();
    if (payload) {
      const featuredResult = await payload.find({
        collection: "packages",
        where: { and: [{ status: { equals: "published" } }, { featured: { equals: true } }] },
        limit,
        depth: 1,
        overrideAccess: true,
        sort: "-updatedAt",
      }).catch(() => ({ docs: [] }));

      const result = featuredResult.docs.length
        ? featuredResult
        : await payload.find({
            collection: "packages",
            where: { status: { equals: "published" } },
            limit,
            depth: 1,
            overrideAccess: true,
            sort: "-updatedAt",
          });

      packages = result.docs as unknown as Package[];
    }
  } catch (error) {
    console.error("[homepage] Failed to load featured packages:", error);
  }

  return (
    <section className="section homepage-packages">
      <div className="container">
        <SectionHeader title="Our Featured Packages" />
        {packages.length ? (
          <div className="card-grid">
            {packages.map((item) => (
              <PackageCard item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <div className="homepage-packages__empty">
            Published safari packages will appear here once they are added from the dashboard.
          </div>
        )}
      </div>
    </section>
  );
}

export function JeepSafari() {
  return (
    <section className="section jeep">
      <div className="container split">
        <Image
          src="/assets/img/jeep-safari.jpg"
          alt="Off-road jeep safari in Kenya and Tanzania"
          width={700}
          height={500}
          loading="eager"
        />
        <div>
          <SectionHeader title="Why the Off-road Jeep Safari?" />
          <p>
            A strong 4x4 safari vehicle is the heartbeat of a good Kenya
            Tanzania safari adventure. Nature Romp Safaris combines reliable
            off-road transport, pop-up roof viewing and experienced driver-guides
            so your vehicle fleet supports the wildlife, landscapes and culture
            you came to experience.
          </p>
          <p>
            African safaris bring together big game, open savannahs, local
            communities and rare moments of stillness, making them ideal for
            wildlife enthusiasts, adventure seekers and unique African
            honeymoons. Start your African tour with a route built for comfort,
            visibility and unforgettable days in the bush.
          </p>
          <Link className="jeep__cta" href="/safari-packages">Start your adventure <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

export async function Testimonials() {
  let trustIndexEmbed = "";
  let reviewHeading = "What Guests Say on Google";

  try {
    const payload = await getSafePayload();
    if (payload) {
      const settings = await payload.findGlobal({
        slug: "site-settings",
        overrideAccess: true,
      }) as Record<string, unknown>;
      trustIndexEmbed = typeof settings?.trustindexEmbed === "string" ? settings.trustindexEmbed : "";
      reviewHeading = typeof settings?.reviewHeading === "string" && settings.reviewHeading.trim()
        ? settings.reviewHeading
        : reviewHeading;
    }
  } catch (error) {
    console.error("[homepage] Failed to load testimonials settings:", error);
  }

  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHeader eyebrow="Google reviews" title={reviewHeading} />
        
        {trustIndexEmbed ? (
          <div className="trustindex-wrapper google-reviews-widget" dangerouslySetInnerHTML={{ __html: trustIndexEmbed }} />
        ) : (
          <div className="google-reviews-empty" data-animate="section">
            <strong>Google reviews widget pending</strong>
            <p>Add the Trustindex Google Reviews embed code in the dashboard under Site Settings to show the live, auto-updating review slider here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export async function GalleryPreview() {
  let items: Array<Record<string, unknown>> = [];

  try {
    const payload = await getSafePayload();
    if (payload) {
      const featuredResult = await payload.find({
        collection: "gallery" as never,
        depth: 1,
        limit: 8,
        overrideAccess: true,
        sort: "sortOrder",
        where: { and: [{ status: { equals: "published" } }, { featured: { equals: true } }] } as never,
      }).catch(() => ({ docs: [] }));

      const result = featuredResult.docs.length
        ? featuredResult
        : await payload.find({
            collection: "gallery" as never,
            depth: 1,
            limit: 8,
            overrideAccess: true,
            sort: "sortOrder",
            where: { status: { equals: "published" } } as never,
          }).catch(() => ({ docs: [] }));

      items = result.docs as Array<Record<string, unknown>>;
    }
  } catch (error) {
    console.error("[homepage] Failed to load gallery preview:", error);
  }

  return (
    <section className="section gallery-section">
      <div className="container">
        <SectionHeader eyebrow="Safari moments" title="Gallery From the Field" />
        <div className="gallery-grid" data-animate="section">
          {items.length ? items.map((item) => (
            <Link href="/photo-gallery" className="gallery-item" key={String(item.id)}>
              <Image src={mediaUrl(item.image)} alt={String(item.alt || item.title || "Nature Romp Safaris gallery")} width={420} height={320} unoptimized />
            </Link>
          )) : (
            <p>Featured gallery images will appear here once they are published from the dashboard.</p>
          )}
        </div>
        <div className="section-cta"><Link className="btn btn--outline" href="/photo-gallery">Open Gallery <ArrowRight size={16} /></Link></div>
      </div>
    </section>
  );
}

export function HomepageFaqs() {
  return <HomepageFaqsExperience />;
}

const bookingProof = [
  {
    icon: Clock3,
    text: "Personalized service by safari experts with first-hand East Africa knowledge",
  },
  {
    icon: Gem,
    text: "Guest-reviewed Kenya and Tanzania safari planning with clear pre-trip guidance",
  },
  {
    icon: ShieldCheck,
    text: "Booking support with transparent quotes, responsive updates and local coordination",
  },
  {
    icon: MapPinned,
    text: "Customizable tours shaped around wildlife seasons, comfort level and travel pace",
  },
];

export function BookingSecurityPartners() {
  return (
    <section className="section booking-security">
      <div className="container booking-security__inner">
        <p>
          Nature Romp Safaris plans every Kenya Tanzania safari adventure with
          first-hand East Africa knowledge, reliable local coordination and
          careful route advice. We keep accommodation choices transparent,
          travel days practical and guest communication close so your safari
          feels protected from rushed planning and avoidable surprises.
        </p>
        <div className="booking-security__grid" aria-label="Why book with Nature Romp Safaris">
          {bookingProof.map(({ icon: Icon, text }) => (
            <div className="booking-security__item" key={text}>
              <Icon size={58} strokeWidth={1.6} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function BlogPreview() {
  let posts = staticPosts.slice(0, 4) as unknown as BlogSummary[];

  try {
    const payload = await getSafePayload();
    if (payload) {
      const result = await payload.find({
        collection: "posts",
        where: { status: { equals: "published" } },
        sort: "-publishedAt",
        limit: 4,
        overrideAccess: true,
      });
      if (result.docs.length > 0) {
        posts = result.docs as unknown as BlogSummary[];
      }
    }
  } catch (error) {
    console.error("[homepage] Failed to load blog preview:", error);
  }
  const [featuredPost, ...sidePosts] = posts;

  return (
    <section className="section news-insights">
      <div className="container">
        <div className="news-insights__head">
          <h2>News and Insights</h2>
          <p>Fresh safari planning guides, destination notes and route advice from Nature Romp Safaris.</p>
          <span aria-hidden="true" />
        </div>
        {featuredPost ? (
          <div className="news-insights__layout">
            <Link href={`/blog/${featuredPost.slug}`} className="news-insights__featured">
              <Image
                src={mediaUrl(featuredPost.image, "/assets/img/blog-details1.jpg")}
                alt={mediaAlt(featuredPost.image, featuredPost.title)}
                width={820}
                height={560}
                unoptimized
              />
              <div className="news-insights__content">
                <span>Safari guide</span>
                <h3>{featuredPost.title}</h3>
                <p>{featuredPost.excerpt}</p>
                <strong>Read article <ArrowRight size={17} /></strong>
              </div>
            </Link>
            <div className="news-insights__side">
              {(sidePosts.length ? sidePosts : posts.slice(0, 2)).slice(0, 1).map((item) => (
                <Link href={`/blog/${item.slug}`} className="news-insights__story" key={item.slug}>
                  <Image
                    src={mediaUrl(item.image, "/assets/img/blog1.jpg")}
                    alt={mediaAlt(item.image, item.title)}
                    width={360}
                    height={240}
                    unoptimized
                  />
                  <div className="news-insights__content">
                    <span>Latest article</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <strong>Read article <ArrowRight size={17} /></strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function NewsletterSignup() {
  return (
    <section className="section newsletter-section">
      <div className="container newsletter-section__inner">
        <p>
          Plan your next adventure with us! We are available for you 24/7,
          wherever you are in the world. You will be the first to know about
          safari ideas, seasonal offers and route updates if you leave your
          email here.
        </p>
        <form action="/contact" className="newsletter-form" method="get">
          <label className="sr-only" htmlFor="newsletter-email">Email address</label>
          <input id="newsletter-email" name="email" placeholder="Enter Email address" type="email" required />
          <input name="source" type="hidden" value="newsletter" />
          <button type="submit">Send</button>
        </form>
      </div>
    </section>
  );
}

export function ContactBand() {
  return (
    <section className="section contact-band">
      <div className="container split">
        <div>
          <SectionHeader title="We&apos;re Here For You" />
          <p>
            Nature Romp Safaris provides East African wildlife safari packages
            across Kenya, Tanzania, Uganda, Rwanda, Zanzibar and Zambia. Start
            with your preferred dates and our team will shape the route.
          </p>
        </div>
        <EnquiryForm />
      </div>
    </section>
  );
}
