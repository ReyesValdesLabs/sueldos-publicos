import { describe, expect, it } from "vitest";
import { GUIDES } from "./guides";

describe("GUIDES", () => {
  it("uses unique slugs and complete editorial metadata", () => {
    expect(new Set(GUIDES.map((guide) => guide.slug)).size).toBe(GUIDES.length);
    expect(GUIDES.length).toBeGreaterThanOrEqual(6);

    for (const guide of GUIDES) {
      expect(guide.title.length).toBeGreaterThan(20);
      expect(guide.description.length).toBeGreaterThan(70);
      expect(guide.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.sources.length).toBeGreaterThanOrEqual(2);
      expect(guide.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    }
  });
});
