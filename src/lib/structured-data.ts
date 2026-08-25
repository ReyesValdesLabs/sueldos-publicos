import { SITE } from "@/data/site";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface WebPageOptions {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  datePublished?: string;
  dateModified?: string;
  author?: "editorialAuthor";
}

interface CalculatorOptions {
  name: string;
  description: string;
  path: string;
}

const absoluteUrl = (path: string) => new URL(path, SITE.url).href;

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": SITE.organizationId,
  name: SITE.name,
  url: SITE.url,
  logo: {
    "@type": "ImageObject",
    url: SITE.logoUrl,
  },
  sameAs: [SITE.githubOrganizationUrl],
};

export const personStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": SITE.editorialAuthorId,
  name: SITE.editorialAuthorName,
  url: SITE.editorialAuthorId,
  sameAs: [SITE.linkedinUrl],
};

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE.websiteId,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "es-CL",
  publisher: { "@id": SITE.organizationId },
};

export const webPageStructuredData = ({
  name,
  description,
  path,
  type = "WebPage",
  datePublished = SITE.publishedAt,
  dateModified = SITE.updatedAt,
  author,
}: WebPageOptions) => ({
  "@context": "https://schema.org",
  "@type": type,
  "@id": `${absoluteUrl(path)}#webpage`,
  url: absoluteUrl(path),
  name,
  description,
  inLanguage: "es-CL",
  datePublished,
  dateModified,
  isPartOf: { "@id": SITE.websiteId },
  about: { "@id": SITE.organizationId },
  ...(author === "editorialAuthor" && {
    author: { "@id": SITE.editorialAuthorId },
  }),
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: SITE.socialImageUrl,
  },
});

export const breadcrumbStructuredData = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const calculatorStructuredData = ({ name, description, path }: CalculatorOptions) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${absoluteUrl(path)}#application`,
  name,
  description,
  url: absoluteUrl(path),
  inLanguage: "es-CL",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  browserRequirements: "Requiere un navegador moderno con JavaScript habilitado.",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CLP",
  },
  provider: { "@id": SITE.organizationId },
  creator: { "@id": SITE.editorialAuthorId },
});
