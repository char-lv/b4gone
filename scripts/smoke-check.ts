// Smoke-checks a deployed B4Gone site (issue #11): the homepage, after redirects, must return
// HTML with B4Gone in the page title. Usage: npm run smoke -- https://<deployment-url>
// For a Vercel deployment behind Deployment Protection, set VERCEL_AUTOMATION_BYPASS_SECRET; it is
// sent as a request header and never printed.

// An ES module, so top-level await is allowed.
export {};

type Check = { name: string; ok: boolean; detail: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function stop(message: string): never {
  console.error(message);
  process.exit(1);
}

const target = process.argv[2] ?? process.env.SMOKE_URL;
if (!target) stop("Usage: npm run smoke -- <deployment URL>");
if (!URL.canParse(target)) stop(`Not a valid URL: ${target}`);

const url = new URL("/", target);
if (url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname)) {
  stop("Use an https:// URL; plain http is accepted only for localhost.");
}

const headers: Record<string, string> = { "user-agent": "b4gone-smoke-check" };
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (bypassSecret) headers["x-vercel-protection-bypass"] = bypassSecret;

const started = performance.now();
let response: Response;
try {
  response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(20_000) });
} catch (error) {
  stop(`Could not reach ${url.href}: ${error instanceof Error ? error.message : String(error)}`);
}
const body = await response.text();
const elapsedMs = Math.round(performance.now() - started);

const contentType = response.headers.get("content-type") ?? "";
const title = /<title>([^<]*)<\/title>/.exec(body)?.[1] ?? "";
const checks: Check[] = [
  { name: "HTTP status", ok: response.status === 200, detail: String(response.status) },
  { name: "HTML response", ok: contentType.includes("text/html"), detail: contentType || "missing" },
  { name: "Page title contains B4Gone", ok: title.includes("B4Gone"), detail: title || "missing" },
];

console.log(`Smoke check: GET ${url.href} -> ${response.url} (${elapsedMs} ms)`);
const vercelId = response.headers.get("x-vercel-id");
if (vercelId) console.log(`x-vercel-id: ${vercelId}`);
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
}
if (checks.some((check) => !check.ok)) process.exitCode = 1;
