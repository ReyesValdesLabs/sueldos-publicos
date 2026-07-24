import { LEGAL_ENTRIES } from "@/data/legal";

const staticPages = [
  "",
  "calculadoras/docentes/",
  "calculadoras/tecnicos-parvulos/",
  "calculadoras/tramos-docentes/",
  "legal/",
  "privacidad/",
  "terminos/",
];

export function GET({ site }: { site: URL }) {
  const pages = [
    ...staticPages,
    ...LEGAL_ENTRIES.map((entry) => `legal/${entry.slug}/`),
  ];
  const urls = pages.map((path) => {
    const loc = new URL(path, site).href;
    const priority = path === "" ? "1.0" : path.startsWith("calculadoras/") ? "0.9" : "0.7";
    return `  <url><loc>${loc}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
