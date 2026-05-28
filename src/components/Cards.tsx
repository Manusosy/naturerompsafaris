import Image from "next/image";
import Link from "next/link";

import type { packages, posts } from "@/content/site";

type Package = (typeof packages)[number];
type Post = (typeof posts)[number];

export function PackageCard({ item }: { item: Package }) {
  return (
    <article className="tour-card">
      <Link href={`/safari-packages/${item.slug}`} className="tour-card__image">
        <Image src={item.image} alt={item.title} width={640} height={420} />
        <span className="tour-card__duration">{item.duration}</span>
      </Link>
      <div className="tour-card__body">
        <h3><Link href={`/safari-packages/${item.slug}`}>{item.title}</Link></h3>
        <p>{item.excerpt}</p>
        <Link href={`/safari-packages/${item.slug}`} className="tour-card__button">
          Book Now
        </Link>
      </div>
    </article>
  );
}

export function BlogCard({ item }: { item: Post }) {
  return (
    <article className="blog-card">
      <Link href={`/blog/${item.slug}`}>
        <Image src={item.image} alt={item.title} width={640} height={420} />
      </Link>
      <div className="blog-card__body">
        <span>Safari Guide</span>
        <h3><Link href={`/blog/${item.slug}`}>{item.title}</Link></h3>
        <p>{item.excerpt}</p>
        <Link href={`/blog/${item.slug}`} className="read-more">
          Read More
        </Link>
      </div>
    </article>
  );
}

export type Destination = {
  name?: string;
  slug?: string;
  country?: string;
  summary?: string;
  heroImage?: string;
};

export function DestinationCard({ item }: { item: Destination }) {
  const countryBadge = item.country === "kenya" ? "Kenya" : item.country === "tanzania" ? "Tanzania" : "East Africa";
  
  return (
    <article className="destination-card">
      <Link href={`/destinations/${item.slug}`} className="destination-card__image">
        <Image src={item.heroImage || "/assets/img/banner1.webp"} alt={item.name || "Destination"} width={640} height={420} />
        <span className="destination-card__badge">{countryBadge}</span>
      </Link>
      <div className="destination-card__body">
        <h3><Link href={`/destinations/${item.slug}`}>{item.name}</Link></h3>
        <p>{item.summary}</p>
        <Link href={`/destinations/${item.slug}`} className="destination-card__button">
          Explore Destination
        </Link>
      </div>
    </article>
  );
}
