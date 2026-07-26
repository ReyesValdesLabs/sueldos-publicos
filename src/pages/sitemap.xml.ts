import { LEGAL_ENTRIES } from "@/data/legal";
import { LEGAL_CONTENT_REVIEWED_AT, STATIC_PAGE_LAST_MODIFIED } from "@/data/site";

const staticPages = Object.entries(STATIC_PAGE_LAST_MODIFIED).map(([path, lastModified]) => ({
  path,
  lastModified,
}));

export function GET({ site }: { site: URL }) {
  const pages = [
    ...staticPages,
    ...LEGAL_ENTRIES.map((entry) => ({
      path: `legal/${entry.slug}/`,
      lastModified: LEGAL_CONTENT_REVIEWED_AT,
    })),
  ];
  const urls = pages.map(({ path, lastModified }) => {
    const loc = new URL(path, site).href;
    return `  <url><loc>${loc}</loc><lastmod>${lastModified}</lastmod></url>`;
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
