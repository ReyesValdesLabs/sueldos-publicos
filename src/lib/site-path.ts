export function sitePath(path = "/") {
  const configuredBase = import.meta.env.BASE_URL || "/";
  const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;

  if (!path || path === "/") return base;
  if (path.startsWith("#")) return `${base}${path}`;

  return `${base}${path.replace(/^\/+/, "")}`;
}
