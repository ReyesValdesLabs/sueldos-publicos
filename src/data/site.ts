export const SITE = {
  name: "Sueldos Públicos",
  url: "https://sueldospublicos.cl/",
  description: "Calculadoras de sueldos públicos en Chile para docentes, asistentes de la educación y personal administrativo municipal.",
  organizationId: "https://sueldospublicos.cl/#organization",
  websiteId: "https://sueldospublicos.cl/#website",
  logoUrl: "https://sueldospublicos.cl/sueldospublicos-mark.png",
  socialImageUrl: "https://sueldospublicos.cl/og.png",
  githubOrganizationUrl: "https://github.com/ReyesValdesLabs",
  githubUrl: "https://github.com/ReyesValdesLabs/sueldos-publicos",
  issuesUrl: "https://github.com/ReyesValdesLabs/sueldos-publicos/issues/new",
  editorialAuthorName: "Victor Reyes Medina",
  editorialAuthorId: "https://sueldospublicos.cl/acerca-de/#victor-reyes-medina",
  linkedinUrl: "https://www.linkedin.com/in/vreyes-medina/",
  publishedAt: "2026-07-18",
  updatedAt: "2026-09-03",
} as const;

export const LEGAL_CONTENT_PUBLISHED_AT = "2026-07-18";
export const LEGAL_CONTENT_REVIEWED_AT = "2026-07-26";
export const CALCULATOR_CONTENT_REVIEWED_AT = "2026-08-05";
export const ABOUT_CONTENT_REVIEWED_AT = "2026-08-25";
export const GUIDES_CONTENT_PUBLISHED_AT = "2026-09-03";
export const GUIDES_CONTENT_REVIEWED_AT = "2026-09-03";

export const STATIC_PAGE_LAST_MODIFIED = {
  "": SITE.updatedAt,
  "calculadoras/docentes/": CALCULATOR_CONTENT_REVIEWED_AT,
  "calculadoras/tecnicos-parvulos/": CALCULATOR_CONTENT_REVIEWED_AT,
  "calculadoras/administrativos-municipales/": CALCULATOR_CONTENT_REVIEWED_AT,
  "calculadoras/tramos-docentes/": CALCULATOR_CONTENT_REVIEWED_AT,
  "legal/": LEGAL_CONTENT_REVIEWED_AT,
  "guias/": GUIDES_CONTENT_REVIEWED_AT,
  "acerca-de/": ABOUT_CONTENT_REVIEWED_AT,
  "metodologia/": SITE.updatedAt,
  "contacto/": SITE.updatedAt,
  "privacidad/": SITE.updatedAt,
  "terminos/": SITE.updatedAt,
} as const;
