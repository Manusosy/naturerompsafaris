export type ArticleTocItem = {
  id: string;
  level: 2 | 3 | 4;
  text: string;
};

const HEADING_RE = /<h([2-4])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function readExistingId(attrs = "") {
  const match = attrs.match(/\bid=["']([^"']+)["']/i);
  return match?.[1]?.trim() || "";
}

function uniqueId(base: string, usedIds: Set<string>) {
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function buildArticleToc(html: string, minItems = 2) {
  const items: ArticleTocItem[] = [];
  const usedIds = new Set<string>();

  const htmlWithIds = html.replace(HEADING_RE, (match, levelRaw, attrsRaw, inner) => {
    const level = Number(levelRaw) as 2 | 3 | 4;
    const text = stripTags(inner);
    if (!text) return match;

    const attrs = attrsRaw ?? "";
    let id = readExistingId(attrs);
    if (!id) {
      id = uniqueId(slugifyHeading(text), usedIds);
    } else {
      id = uniqueId(id, usedIds);
    }

    usedIds.add(id);
    items.push({ id, level, text });

    const attrsWithoutId = attrs.replace(/\s*id=["'][^"']*["']/i, "");
    return `<h${level}${attrsWithoutId} id="${id}">${inner}</h${level}>`;
  });

  return {
    htmlWithIds,
    items,
    showToc: items.length >= minItems,
  };
}

export function articleTocItemListSchema(items: ArticleTocItem[], articleUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      name: item.text,
      position: index + 1,
      url: `${articleUrl}#${item.id}`,
    })),
    name: "Table of contents",
  };
}
