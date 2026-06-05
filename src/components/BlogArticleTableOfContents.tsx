import { ListTree } from "lucide-react";

import type { ArticleTocItem } from "@/lib/article-toc";

export function BlogArticleTableOfContents({ items }: { items: ArticleTocItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className="blog-article-toc">
      <div className="blog-article-toc__head">
        <ListTree aria-hidden size={16} />
        <span>On this page</span>
      </div>
      <ol className="blog-article-toc__list">
        {items.map((item) => (
          <li
            className={`blog-article-toc__item blog-article-toc__item--h${item.level}`}
            key={item.id}
          >
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
