import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { getImageUrl, getMediaAlt, type BlogSummary } from "@/components/Cards";

function categoryLabel(category: BlogSummary["category"]) {
  if (typeof category === "string" && category.trim()) return category.trim();
  if (category && typeof category === "object") {
    return String(category.name ?? category.title ?? "").trim();
  }
  return "";
}

function formatPublishedDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogRelatedCard({ item }: { item: BlogSummary }) {
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title || "Safari article");
  const category = categoryLabel(item.category);
  const publishedDate = formatPublishedDate(item.publishedAt);

  return (
    <article className="blog-related-card">
      <Link className="blog-related-card__media" href={`/blog/${item.slug}`}>
        <Image
          alt={imageAlt}
          className="blog-related-card__image"
          height={280}
          sizes="(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 33vw"
          src={imageSrc}
          unoptimized
          width={420}
        />
      </Link>
      <div className="blog-related-card__body">
        {category ? <span className="blog-related-card__category">{category}</span> : null}
        <h3>
          <Link href={`/blog/${item.slug}`}>{item.title}</Link>
        </h3>
        {item.excerpt ? <p>{item.excerpt}</p> : null}
        <div className="blog-related-card__foot">
          {publishedDate ? (
            <time className="blog-related-card__date" dateTime={item.publishedAt}>
              <CalendarDays aria-hidden size={14} />
              {publishedDate}
            </time>
          ) : (
            <span />
          )}
          <Link className="blog-related-card__cta" href={`/blog/${item.slug}`}>
            Read article
            <ArrowRight aria-hidden size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
