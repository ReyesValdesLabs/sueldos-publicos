import { describe, expect, it } from "vitest";
import { ABOUT_CONTENT_REVIEWED_AT, SITE, STATIC_PAGE_LAST_MODIFIED } from "@/data/site";
import {
  calculatorStructuredData,
  organizationStructuredData,
  personStructuredData,
  webPageStructuredData,
} from "@/lib/structured-data";

describe("structured author data", () => {
  it("publishes the editorial author as a person linked to LinkedIn", () => {
    expect(personStructuredData).toMatchObject({
      "@type": "Person",
      "@id": SITE.editorialAuthorId,
      name: SITE.editorialAuthorName,
      url: SITE.editorialAuthorId,
      sameAs: [SITE.linkedinUrl],
    });
  });

  it("keeps the personal profile separate from the publisher organization", () => {
    expect(organizationStructuredData.sameAs).toEqual([SITE.githubUrl]);
    expect(organizationStructuredData.sameAs).not.toContain(SITE.linkedinUrl);
  });

  it("updates only the about page review date for this editorial change", () => {
    expect(STATIC_PAGE_LAST_MODIFIED["acerca-de/"]).toBe(ABOUT_CONTENT_REVIEWED_AT);
    expect(SITE.updatedAt).not.toBe(ABOUT_CONTENT_REVIEWED_AT);
  });

  it("attributes web pages and calculator applications to the editorial author", () => {
    const page = webPageStructuredData({
      name: "Página de prueba",
      description: "Descripción de prueba",
      path: "prueba/",
    });
    const calculator = calculatorStructuredData({
      name: "Calculadora de prueba",
      description: "Descripción de prueba",
      path: "calculadoras/prueba/",
    });

    expect(page.author).toEqual({ "@id": SITE.editorialAuthorId });
    expect(calculator.creator).toEqual({ "@id": SITE.editorialAuthorId });
    expect(calculator.provider).toEqual({ "@id": SITE.organizationId });
  });
});
