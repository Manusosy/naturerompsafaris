import { describe, expect, it } from "vitest";

import { buildArticleToc, slugifyHeading } from "./article-toc";

describe("article toc", () => {
  it("slugifies heading text", () => {
    expect(slugifyHeading("Best Time to Visit Kenya")).toBe("best-time-to-visit-kenya");
  });

  it("builds toc items and injects heading ids", () => {
    const html = `
      <p>Intro</p>
      <h2>Planning your safari</h2>
      <p>Body</p>
      <h3>When to go</h3>
      <h2>Border logistics</h2>
    `;
    const result = buildArticleToc(html);

    expect(result.showToc).toBe(true);
    expect(result.items).toEqual([
      { id: "planning-your-safari", level: 2, text: "Planning your safari" },
      { id: "when-to-go", level: 3, text: "When to go" },
      { id: "border-logistics", level: 2, text: "Border logistics" },
    ]);
    expect(result.htmlWithIds).toContain('id="planning-your-safari"');
    expect(result.htmlWithIds).toContain('id="when-to-go"');
  });

  it("hides toc when fewer than two headings exist", () => {
    const result = buildArticleToc("<h2>Only one section</h2>");
    expect(result.showToc).toBe(false);
    expect(result.items).toHaveLength(1);
  });
});
