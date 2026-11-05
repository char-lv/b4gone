// Where to send a user after signing in (issue #2). Only same-site paths are allowed, so a crafted
// ?next= link cannot bounce someone to another site after they enter their password.
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

const ACCOUNT_PAGES = new Set(["/sign-in", "/register"]);

// A fixed stand-in origin: the path is parsed the way a browser would, then must stay on it.
const TRUSTED_ORIGIN = "https://b4gone.invalid";

// URL parsing silently removes tab, CR, and LF, so "/\t/evil.example" would become "//evil.example".
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function safeNextPath(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || CONTROL_CHARACTERS.test(raw)) return DEFAULT_SIGNED_IN_PATH;

  let url: URL;
  try {
    url = new URL(raw, TRUSTED_ORIGIN);
  } catch {
    return DEFAULT_SIGNED_IN_PATH;
  }
  if (url.origin !== TRUSTED_ORIGIN) return DEFAULT_SIGNED_IN_PATH;

  // "/.//evil.example" stays on the trusted origin but normalizes to the protocol-relative "//evil.example".
  if (url.pathname.startsWith("//")) return DEFAULT_SIGNED_IN_PATH;

  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (ACCOUNT_PAGES.has(pathname.toLowerCase())) return DEFAULT_SIGNED_IN_PATH;

  return `${url.pathname}${url.search}${url.hash}`;
}
