// Where to send a user after signing in (issue #2). Only same-site paths are allowed, so a crafted
// ?next= link cannot bounce someone to another site after they enter their password.
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

const ACCOUNT_PAGES = new Set(["/sign-in", "/register"]);

export function safeNextPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  const pathname = path.split(/[?#]/)[0];
  return ACCOUNT_PAGES.has(pathname) ? DEFAULT_SIGNED_IN_PATH : path;
}
