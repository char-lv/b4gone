// CSRF protection for cookie-authenticated mutations (issue #2). Browsers send Origin on POST, PUT,
// PATCH, and DELETE requests; older ones send at least Sec-Fetch-Site. A request with neither header
// comes from a non-browser client, which cannot carry a victim's cookies, so it is allowed.
const ALLOWED_FETCH_SITES = new Set(["same-origin", "none"]);

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin !== null) return origin === new URL(request.url).origin;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null) return ALLOWED_FETCH_SITES.has(fetchSite);

  return true;
}
