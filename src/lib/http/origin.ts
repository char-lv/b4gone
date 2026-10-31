// CSRF protection for cookie-authenticated mutations (issue #2). Browsers send Origin on POST, PUT,
// PATCH, and DELETE requests; older ones send at least Sec-Fetch-Site. A request with neither header
// comes from a non-browser client, which cannot carry a victim's cookies, so it is allowed.
const ALLOWED_FETCH_SITES = new Set(["same-origin", "none"]);

/**
 * The origin the browser actually used. Next.js reports request.url with its own hostname, so the
 * Host header (or the host and protocol forwarded by Vercel) is the reliable source. Browsers cannot
 * set these headers on a cross-site request without a CORS preflight, which these routes never allow.
 */
function siteOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  return `${protocol.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin !== null) return origin === siteOrigin(request);

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null) return ALLOWED_FETCH_SITES.has(fetchSite);

  return true;
}
