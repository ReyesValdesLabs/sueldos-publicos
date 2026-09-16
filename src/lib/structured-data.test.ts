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
    expect(organizationStructuredData.sameAs).toEqual([SITE.githubOrganizationUrl]);
    expect(organizationStructuredData.sameAs).not.toContain(SITE.linkedinUrl);
    expect(organizationStructuredData.sameAs).not.toContain(SITE.githubUrl);
  });

  it("updates only the about page review date for this editorial change", () => {
    expect(STATIC_PAGE_LAST_MODIFIED["acerca-de/"]).toBe(ABOUT_CONTENT_REVIEWED_AT);
    expect(SITE.updatedAt).not.toBe(ABOUT_CONTENT_REVIEWED_AT);
  });

  it("omits personal authorship from web pages without a visible byline", () => {
    const unsignedPage = webPageStructuredData({
      name: "Página de prueba",
      description: "Descripción de prueba",
      path: "prueba/",
    });
    const signedPage = webPageStructuredData({
      name: "Página firmada",
      description: "Descripción de prueba",
      path: "firmada/",
      author: "editorialAuthor",
    });

    expect(unsignedPage).not.toHaveProperty("author");
    expect(signedPage.author).toEqual({ "@id": SITE.editorialAuthorId });
  });

  it("attributes calculator applications to the person and keeps the organization as provider", () => {
    const calculator = calculatorStructuredData({
      name: "Calculadora de prueba",
      description: "Descripción de prueba",
      path: "calculadoras/prueba/",
    });

    expect(calculator.creator).toEqual({ "@id": SITE.editorialAuthorId });
    expect(calculator.provider).toEqual({ "@id": SITE.organizationId });
  });
});
