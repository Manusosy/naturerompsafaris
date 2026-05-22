import { CalendarDays, MapPin } from "lucide-react";
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
      </Link>
      <div className="tour-card__body">
        <div className="tour-card__meta">
          <span><CalendarDays size={15} /> {item.duration}</span>
          <span><MapPin size={15} /> {item.category}</span>
        </div>
        <h3><Link href={`/safari-packages/${item.slug}`}>{item.title}</Link></h3>
        <p>{item.excerpt}</p>
        <Link href={`/safari-packages/${item.slug}`} className="read-more">
          Explore More
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
