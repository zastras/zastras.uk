#!/usr/bin/env node
/**
 * Asks the deployed site the same indexing questions that check-site.mjs asks the source files.
 * It reads what a crawler is served: status codes, redirects, response headers and the HTML itself.
 * Read-only; it never changes anything. Node 18+, no dependencies.
 *
 *   node scripts/verify-live.mjs                          check https://zastras.uk
 *   node scripts/verify-live.mjs --origin https://example   check another origin (rarely needed)
 *   node scripts/verify-live.mjs --json                   also print a table as JSON (for the launch report)
 *   node scripts/verify-live.mjs --once                   do not retry (the default retries for about 2.5 minutes)
 *
 * The URL list comes from the live sitemap, so a new page is checked as soon as it is in the sitemap.
 * GitHub Pages caches responses for up to ten minutes, so a failing run is retried a few times before it counts.
 */
const argv = process.argv.slice(2);
const originArg = argv.indexOf("--origin");
const ORIGIN = (originArg >= 0 ? argv[originArg + 1] : "https://zastras.uk").replace(/\/$/, "");
const HOST = new URL(ORIGIN).host;
const ATTEMPTS = argv.includes("--once") ? 1 : 6;
const WAIT_MS = 30_000;

const UA = { "user-agent": "zastras-live-check/1.0 (+https://zastras.uk/)" };
const get = (url, opts = {}) => fetch(url, { redirect: "manual", headers: UA, ...opts });
const BLOCKING = /(^|[\s,])(noindex|none|nofollow|nosnippet)(?=$|[\s,])/i;

async function run() {
  const problems = [];
  const rows = [];
  const bad = (m) => problems.push(m);

  /* sitemap and robots.txt */
  const robots = await get(`${ORIGIN}/robots.txt`);
  const robotsText = await robots.text();
  if (robots.status !== 200) bad(`/robots.txt returned ${robots.status}`);
  if (/^\s*disallow:\s*\S/im.test(robotsText)) bad("/robots.txt disallows something");
  if (!new RegExp(`^sitemap:\\s*${ORIGIN.replace(/[.]/g, "\\.")}/sitemap\\.xml\\s*$`, "im").test(robotsText)) bad(`/robots.txt does not point at ${ORIGIN}/sitemap.xml`);
  if (/noindex/i.test(robots.headers.get("x-robots-tag") || "")) bad("/robots.txt sends X-Robots-Tag: noindex");

  const sm = await get(`${ORIGIN}/sitemap.xml`);
  const smText = await sm.text();
  if (sm.status !== 200) bad(`/sitemap.xml returned ${sm.status}`);
  if (!/xml/.test(sm.headers.get("content-type") || "")) bad(`/sitemap.xml content-type is ${sm.headers.get("content-type")}`);
  const urls = [...smText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) bad("the sitemap lists no URLs");

  /* every sitemap URL: 200, no redirect, indexable, self-canonical, readable without JavaScript */
  for (const url of urls) {
    const res = await get(url);
    const html = res.status === 200 ? await res.text() : "";
    const row = { url, status: res.status, xRobotsTag: res.headers.get("x-robots-tag") || "(none)", metaRobots: "(none)", canonical: "(none)" };
    rows.push(row);
    if (res.status !== 200) { bad(`${url} returned ${res.status}${res.headers.get("location") ? ` to ${res.headers.get("location")}` : ""}`); continue; }
    if (!url.startsWith(ORIGIN + "/")) bad(`${url} is not on ${ORIGIN}`);
    const header = res.headers.get("x-robots-tag") || "";
    if (BLOCKING.test(header)) bad(`${url} sends X-Robots-Tag: ${header}`);
    const robotsMeta = [...html.matchAll(/<meta\s+name="(robots|googlebot|bingbot)"\s+content="([^"]*)"/gi)].map((m) => m[2]).join(", ");
    row.metaRobots = robotsMeta || "(none)";
    if (BLOCKING.test(robotsMeta)) bad(`${url} has a robots meta tag: ${robotsMeta}`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    row.canonical = canonical || "(none)";
    if (canonical !== url) bad(`${url} has canonical ${canonical}`);
    if (!/<title>[^<]+<\/title>/.test(html)) bad(`${url} has no <title>`);
    if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/.test(html)) bad(`${url} has no <h1> in the served HTML`);
    if (!/<nav\b[\s\S]*?<a href="[^"]+"/.test(html)) bad(`${url} has no navigation links in the served HTML`);
    if (/draft-banner|owner-decision|PREVIEW-NOINDEX|\[publication date\]/.test(html)) bad(`${url} still carries draft or preview markers`);
    if (new URL(url).pathname !== "/" && !(await get(url.replace(/\/$/, ""))).headers.get("location")?.endsWith("/")) bad(`${url.replace(/\/$/, "")} should redirect once to the trailing-slash URL`);
  }

  /* host and scheme variants: one hop to the preferred origin, no chain */
  const variants = [`http://${HOST}/`, `http://www.${HOST}/`, `https://www.${HOST}/`];
  if (HOST === "zastras.uk") variants.push("https://zastras.github.io/zastras.uk/");
  for (const v of variants) {
    try {
      const r = await get(v);
      const loc = r.headers.get("location") || "";
      rows.push({ url: v, status: r.status, location: loc });
      if (![301, 308].includes(r.status) || loc !== `${ORIGIN}/`) bad(`${v} should return one 301 to ${ORIGIN}/, got ${r.status} ${loc}`);
    } catch (e) { bad(`${v} failed: ${e.cause?.code || e.message}`); }
  }

  /* a missing URL: a real 404 that stays out of the index */
  for (const missing of [`${ORIGIN}/this-page-does-not-exist/`, `${ORIGIN}/this-page-does-not-exist`]) {
    const r = await get(missing);
    const html = await r.text();
    rows.push({ url: missing, status: r.status, metaRobots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "(none)" });
    if (r.status !== 404) bad(`${missing} returned ${r.status}, not 404`);
    if (!/<meta name="robots" content="[^"]*noindex/.test(html)) bad(`${missing} is a 404 without a noindex tag`);
  }

  /* assets that pages need must be fetchable (robots.txt must not hide them, and they must not be blocked by header) */
  for (const asset of ["assets/css/main.css", "assets/js/main.js", "assets/img/og-image.png", "assets/fonts/geist-latin-wght.woff2"]) {
    const r = await get(`${ORIGIN}/${asset}`);
    if (r.status !== 200) bad(`/${asset} returned ${r.status}`);
    if (BLOCKING.test(r.headers.get("x-robots-tag") || "")) bad(`/${asset} sends X-Robots-Tag: ${r.headers.get("x-robots-tag")}`);
  }
  return { problems, rows, urls };
}

let result;
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  try { result = await run(); } catch (e) { result = { problems: [`request failed: ${e.cause?.code || e.message}`], rows: [], urls: [] }; }
  if (result.problems.length === 0) break;
  if (attempt < ATTEMPTS) {
    console.log(`Attempt ${attempt} of ${ATTEMPTS} found ${result.problems.length} problem(s); waiting ${WAIT_MS / 1000}s in case the cache is catching up.`);
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
}

console.log(`\nLive indexing check for ${ORIGIN}  (${new Date().toISOString()})\n`);
for (const r of result.rows) console.log(`  ${String(r.status).padEnd(4)} ${r.url}${r.location ? `  ->  ${r.location}` : ""}${r.metaRobots && r.metaRobots !== "(none)" ? `  [meta robots: ${r.metaRobots}]` : ""}${r.xRobotsTag && r.xRobotsTag !== "(none)" ? `  [X-Robots-Tag: ${r.xRobotsTag}]` : ""}`);
if (argv.includes("--json")) console.log("\n" + JSON.stringify(result.rows, null, 2));
if (result.problems.length) {
  console.log(`\nFAILED (${result.problems.length}):`);
  result.problems.forEach((p) => console.log("  x " + p));
  process.exit(1);
}
console.log(`\nAll ${result.urls.length} sitemap URLs return 200, are self-canonical and carry no robots block; redirects are single-hop; a missing URL returns 404 with noindex.`);
