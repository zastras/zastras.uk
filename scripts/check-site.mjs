#!/usr/bin/env node
/**
 * Checks for the static site in ./site. Node 18+, no dependencies.
 *
 *   node scripts/check-site.mjs                 every check below; this is what CI runs
 *   node scripts/check-site.mjs --external      also request every external link (needs network)
 *   node scripts/check-site.mjs --root <dir>    check a copy of the site (used by scripts/check-site.test.mjs)
 *
 * The site is published, so there is no draft mode: the checks always fail if a public page carries a
 * robots directive that blocks indexing, a draft banner, an owner-decision box or an unresolved placeholder.
 * (Older instructions mention a --production flag. It is no longer needed; it is simply ignored.)
 *
 * It is deliberately small. It catches the mistakes that are easy to make when editing by hand
 * (broken links and anchors, missing alt text, a changed form endpoint, a dropped legal line, a page that
 * quietly becomes un-indexable, a canonical URL that disagrees with the sitemap, JSON-LD that no longer
 * parses) and does not try to replace a browser or a screen reader. See docs/REVIEW.md for what was
 * checked by hand, and scripts/verify-live.mjs for the same questions asked of the deployed site.
 */
import { readFileSync, readdirSync, statSync, existsSync, openSync, readSync, closeSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const rootArg = argv.indexOf("--root");
const ROOT = rootArg >= 0 ? resolve(argv[rootArg + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), "..", "site");
const ORIGIN = "https://zastras.uk";
const FORM_ENDPOINT = "https://formspree.io/f/maeolban";
const LEGAL_TEXT =
  "Zastras Accelerate is a service of ZASTRAS LTD. Registered in Scotland. Company number SC832156. Registered office: 48 West George Street, 2nd Floor, Glasgow, Scotland, G2 1BP.";

const EXTERNAL = argv.includes("--external");

/* Policy, written down so a change to it is a deliberate edit rather than an accident. */
// robots directives that stop a page being indexed, followed, or shown with a snippet
const BLOCKING_DIRECTIVE = /(^|[\s,])(noindex|none|nofollow|nosnippet|unavailable_after[^,]*)(?=$|[\s,])/i;
// the only structured-data types the site uses. LocalBusiness and its subtypes are left out on purpose:
// the registered office is a company detail, not premises the public can visit.
const LD_TYPES = new Set(["Organization", "WebSite", "WebPage", "Service", "BreadcrumbList", "ListItem"]);
// properties that would state something the business has not published and could not support
const LD_FORBIDDEN = ["aggregateRating", "review", "reviews", "openingHours", "openingHoursSpecification", "priceRange", "telephone", "geo", "hasMap", "address"];
// a page that promises "no third-party resources" must not load any, and these are the usual ways of adding them
const TRACKERS = /googletagmanager|google-analytics|googleadservices|gtag\(|fbq\(|doubleclick|fonts\.googleapis|fonts\.gstatic|hotjar|clarity\.ms|plausible\.io|segment\.com\/analytics/i;
// hosts that must never appear in the site: the preferred origin is https://zastras.uk
const WRONG_ORIGINS = /http:\/\/(www\.)?zastras\.uk|https:\/\/www\.zastras\.uk|zastras\.github\.io/i;

const failures = [];
const warnings = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

/* ----------------------------------------------------------------- helpers */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const rel = (p) => relative(ROOT, p).split(sep).join("/");
const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lsquo;|&rsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&pound;/g, "£").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");
const textOf = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function attrsOf(tagSource) {
  const out = {};
  for (const m of tagSource.matchAll(/([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}
function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  return [...html.matchAll(re)].map((m) => ({ attrs: attrsOf(m[1]), source: m[0] }));
}

function pngSize(file) {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(24);
    readSync(fd, buf, 0, 24, 0);
    return buf.toString("ascii", 1, 4) === "PNG" ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) } : null;
  } finally { closeSync(fd); }
}
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
/** "24 November 2026" -> Date, or null if it is not a real date. */
function parseLongDate(text) {
  const m = text.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  const month = m && MONTHS.indexOf(m[2].toLowerCase());
  if (!m || month < 0) return null;
  const d = new Date(Date.UTC(+m[3], month, +m[1]));
  return d.getUTCDate() === +m[1] ? d : null;
}
const endOfTodayUtc = () => { const n = new Date(); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1) - 1; };

/** Every schema.org node in a parsed JSON-LD value, flattening @graph. */
const ldNodes = (v) => (Array.isArray(v) ? v.flatMap(ldNodes) : v && typeof v === "object" ? [v, ...(v["@graph"] ? ldNodes(v["@graph"]) : [])] : []);
const ldWalk = function* (v) {
  if (Array.isArray(v)) for (const x of v) yield* ldWalk(x);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { yield [k, x]; yield* ldWalk(x); }
};

/** Where does a local URL, written in `fromFile`, point on disk? */
function resolveLocal(fromFile, url) {
  const [path] = url.split("#");
  const base = path === "" ? fromFile : resolve(dirname(fromFile), path);
  if (path === "") return fromFile;
  if (existsSync(base) && statSync(base).isDirectory()) return join(base, "index.html");
  return base;
}

/* ------------------------------------------------------------------- pages */
const files = walk(ROOT);
const pages = files.filter((f) => f.endsWith(".html"));
const idsByPage = new Map();
const externalLinks = new Map();
const pageInfo = new Map();   // file -> { name, canonical, noindex, isNotFoundPage, title, description, h1 }
const linksFrom = new Map();  // file -> Set of page files it links to

for (const file of pages) {
  const name = rel(file);
  const raw = readFileSync(file, "utf8");
  const html = raw.replace(/<!--[\s\S]*?-->/g, "");
  const noScript = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
  const isNotFoundPage = name === "404.html";

  /* ids */
  const ids = [...noScript.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) fail(name, `duplicate id "${id}"`);
    seen.add(id);
  }
  idsByPage.set(file, seen);

  /* head essentials */
  if (!/<html[^>]*\slang="en-GB"/i.test(html)) fail(name, 'missing <html lang="en-GB">');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
  if (!title) fail(name, "missing <title>");
  else if (title.length > 75) warn(name, `title is ${title.length} characters; aim for 60 or fewer`);
  if (!tags(html, "meta").some((t) => t.attrs.name === "viewport")) fail(name, "missing viewport meta");

  const metas = tags(html, "meta");
  const meta = (key, attr = "name") => metas.find((t) => t.attrs[attr] === key)?.attrs.content;

  if (!isNotFoundPage) {
    const desc = meta("description");
    if (!desc) fail(name, "missing meta description");
    else if (desc.length < 70 || desc.length > 180) warn(name, `meta description is ${desc.length} characters; 70 to 180 reads best in search results`);

    const canonicals = tags(html, "link").filter((t) => t.attrs.rel === "canonical");
    const canonical = canonicals[0]?.attrs.href;
    if (canonicals.length !== 1) fail(name, `expected exactly one canonical link, found ${canonicals.length}`);
    else {
      const expectedPath = name === "index.html" ? "/" : "/" + name.replace(/index\.html$/, "");
      if (canonical !== ORIGIN + expectedPath) fail(name, `canonical is ${canonical}, expected ${ORIGIN + expectedPath}`);
      if (meta("og:url", "property") !== canonical) fail(name, `og:url (${meta("og:url", "property")}) must equal the canonical URL (${canonical})`);
    }
    for (const key of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
      if (!meta(key, "property")) fail(name, `missing ${key}`);
    }
    if (!meta("twitter:card")) fail(name, "missing twitter:card");
    const og = meta("og:image", "property");
    if (og) {
      if (!og.startsWith(ORIGIN + "/")) fail(name, `og:image should be an absolute ${ORIGIN} URL`);
      else if (!existsSync(join(ROOT, og.slice(ORIGIN.length)))) fail(name, `og:image file not found in site/: ${og}`);
      else {
        const size = pngSize(join(ROOT, og.slice(ORIGIN.length)));
        const [w, h] = [meta("og:image:width", "property"), meta("og:image:height", "property")];
        if (size && (String(size.width) !== w || String(size.height) !== h)) fail(name, `og:image is ${size.width}x${size.height} but og:image:width/height say ${w}x${h}`);
        if (size && (size.width < 1200 || size.height < 630)) warn(name, `og:image is ${size.width}x${size.height}; 1200x630 is the usual size for large share cards`);
      }
    }
    if (!tags(html, "link").some((t) => (t.attrs.rel || "").includes("icon"))) fail(name, "missing favicon link");
  }

  /* indexing state: public pages must be indexable and followable; only the 404 page is kept out */
  const robotsDirectives = metas
    .filter((t) => ["robots", "googlebot", "bingbot"].includes((t.attrs.name || "").toLowerCase()))
    .map((t) => t.attrs.content || "").join(",");
  const noindex = /noindex|(^|[\s,])none(?=$|[\s,])/i.test(robotsDirectives);
  if (metas.some((t) => (t.attrs["http-equiv"] || "").toLowerCase() === "x-robots-tag")) fail(name, 'http-equiv="X-Robots-Tag" is not a supported way to set robots rules; remove it');
  if (isNotFoundPage) {
    if (!noindex) fail(name, 'the 404 page must keep <meta name="robots" content="noindex">: it is served for addresses that do not exist');
  } else if (BLOCKING_DIRECTIVE.test(robotsDirectives)) {
    fail(name, `robots meta (${robotsDirectives}) blocks indexing, following links or snippets on a public page`);
  }
  if (/PREVIEW-NOINDEX/.test(raw)) fail(name, "PREVIEW-NOINDEX marker comment is still present");

  /* headings */
  const headings = [...noScript.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: +m[1], text: textOf(m[2]) }));
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length !== 1) fail(name, `expected exactly one <h1>, found ${h1s.length}`);
  const canonicalHref = tags(html, "link").find((t) => t.attrs.rel === "canonical")?.attrs.href;
  pageInfo.set(file, { name, canonical: canonicalHref, noindex, isNotFoundPage, title, description: meta("description"), h1: h1s[0]?.text });
  linksFrom.set(file, new Set());
  let last = 0;
  for (const h of headings) {
    if (last && h.level > last + 1) fail(name, `heading level jumps from h${last} to h${h.level} at "${h.text}"`);
    last = h.level;
  }

  /* images */
  for (const img of tags(noScript, "img")) {
    if (!("alt" in img.attrs)) fail(name, `<img src="${img.attrs.src}"> has no alt attribute (use alt="" if decorative)`);
    if (!img.attrs.width || !img.attrs.height) warn(name, `<img src="${img.attrs.src}"> has no width/height, which can cause layout shift`);
  }

  /* links and assets */
  const refs = [];
  for (const tag of ["a", "link", "script", "img", "source"]) {
    for (const t of tags(tag === "script" || tag === "link" ? html : noScript, tag)) {
      const url = t.attrs.href ?? t.attrs.src;
      if (url) refs.push({ tag, url, attrs: t.attrs });
    }
  }
  const metaRefUrls = metas.filter((t) => ["og:image", "twitter:image", "og:url"].includes(t.attrs.property || t.attrs.name)).map((t) => t.attrs.content);
  for (const url of metaRefUrls) {
    if (url?.startsWith(ORIGIN + "/") && !existsSync(join(ROOT, new URL(url).pathname.replace(/\/$/, "/index.html").replace(/^\//, "")))) {
      if (!/\/$/.test(url)) fail(name, `metadata points at a file that does not exist: ${url}`);
    }
  }

  for (const t of [...tags(noScript, "img"), ...tags(noScript, "source")]) {
    for (const candidate of (t.attrs.srcset || "").split(",").map((x) => x.trim().split(/\s+/)[0]).filter(Boolean)) {
      refs.push({ tag: "srcset", url: candidate, attrs: t.attrs });
    }
  }

  for (const { tag, url, attrs } of refs) {
    if (tag === "a" && (url.trim() === "" || url === "#" || /^javascript:/i.test(url))) fail(name, `<a href="${url}"> is not a crawlable link`);
    if (/^(mailto:|tel:|javascript:|data:)/i.test(url)) continue;
    if (WRONG_ORIGINS.test(url)) fail(name, `${tag} points at a non-preferred origin: ${url} (use ${ORIGIN} or a relative path)`);
    if (/^https?:\/\//i.test(url)) {
      if (!url.startsWith(ORIGIN) && tag !== "a") fail(name, `${tag} loads a third-party resource: ${url} (the privacy notice says the site loads none)`);
      if (!url.startsWith(ORIGIN)) {
        const set = externalLinks.get(url) || new Set();
        set.add(name);
        externalLinks.set(url, set);
      }
      continue;
    }
    if (url.startsWith("/") && !isNotFoundPage) {
      fail(name, `root-relative ${tag} "${url}" will break on the GitHub Pages preview (use a relative path)`);
      continue;
    }
    if (isNotFoundPage && url.startsWith("/")) continue;
    const target = resolveLocal(file, url);
    if (!existsSync(target)) {
      fail(name, `${tag} points to missing file: ${url}`);
      continue;
    }
    if (tag === "a") {
      const path = url.split("#")[0].split("?")[0];
      if (/(^|\/)index\.html$/.test(path)) fail(name, `link "${url}" names index.html; link to the directory ("${path.replace(/index\.html$/, "") || "./"}") so there is one URL per page`);
      else if (path && !path.endsWith("/") && statSync(resolve(dirname(file), path)).isDirectory()) fail(name, `link "${url}" lacks the trailing slash, so it would redirect`);
      if (target.endsWith(".html") && target !== file) linksFrom.get(file).add(target);
    }
    const fragment = url.split("#")[1];
    if (fragment && target.endsWith(".html")) {
      const targetIds = idsByPage.get(target) ??
        new Set([...readFileSync(target, "utf8").replace(/<!--[\s\S]*?-->/g, "").matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
      if (!targetIds.has(fragment)) fail(name, `anchor "#${fragment}" not found in ${rel(target)} (from ${url})`);
    }
  }

  /* aria references */
  for (const m of noScript.matchAll(/aria-(?:describedby|labelledby|controls)\s*=\s*"([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) if (!seen.has(id)) fail(name, `aria reference to missing id "${id}"`);
  }

  /* form */
  for (const form of tags(noScript, "form")) {
    if (form.attrs.action !== FORM_ENDPOINT) fail(name, `form action is "${form.attrs.action}", expected ${FORM_ENDPOINT}`);
    if ((form.attrs.method || "").toUpperCase() !== "POST") fail(name, "form method must be POST");
  }
  if (noScript.includes("<form")) {
    const labelFor = new Set([...noScript.matchAll(/<label\b[^>]*\sfor\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
    const wrapped = [...noScript.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].filter((m) => /<input|<textarea|<select/.test(m[1]));
    const wrappedCount = wrapped.length;
    for (const tag of ["input", "textarea", "select"]) {
      for (const el of tags(noScript, tag)) {
        const type = (el.attrs.type || "text").toLowerCase();
        if (["hidden", "submit", "button"].includes(type)) continue;
        if (el.attrs.name === "_gotcha" && wrappedCount > 0) continue;
        if (!el.attrs.id || !labelFor.has(el.attrs.id)) {
          if (!el.attrs["aria-label"]) fail(name, `form control "${el.attrs.name || el.attrs.id}" has no associated <label>`);
        }
      }
    }
    const names = [...tags(noScript, "input"), ...tags(noScript, "textarea")].map((t) => t.attrs.name);
    for (const required of ["name", "email", "message", "_gotcha"]) {
      if (!names.includes(required)) fail(name, `form is missing a field named "${required}"`);
    }
    const email = tags(noScript, "input").find((t) => t.attrs.name === "email");
    if (email && (email.attrs.type !== "email" || !("required" in email.attrs))) fail(name, 'email field must be type="email" and required');
    if (!/<script[^>]*main\.js/.test(html)) warn(name, "main.js is not loaded, so the form will not show inline status messages");
  }

  /* legal footer */
  if (!isNotFoundPage && !textOf(noScript).includes(LEGAL_TEXT)) fail(name, "legal footer text is missing or has been altered");

  /* structured data */
  const ldScripts = [...raw.matchAll(/<script\b[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const ldNodesOnPage = [];
  for (const [i, src] of ldScripts.entries()) {
    let data;
    try { data = JSON.parse(src); } catch (e) { fail(name, `JSON-LD block ${i + 1} does not parse: ${e.message}`); continue; }
    if (data["@context"] !== "https://schema.org") fail(name, `JSON-LD block ${i + 1} must have "@context": "https://schema.org"`);
    for (const node of ldNodes(data)) {
      ldNodesOnPage.push(node);
      const types = [].concat(node["@type"] ?? []);
      if (!types.length && !node["@graph"]) fail(name, "a JSON-LD node has no @type");
      for (const t of types) if (!LD_TYPES.has(t)) fail(name, `JSON-LD type "${t}" is not on the approved list (${[...LD_TYPES].join(", ")}); see LD_TYPES in this script`);
    }
    for (const [key, value] of ldWalk(data)) {
      if (LD_FORBIDDEN.includes(key)) fail(name, `JSON-LD declares "${key}", which the site does not publish`);
      if (typeof value === "string" && /^https?:\/\//.test(value) && key !== "@context") {
        if (!value.startsWith(ORIGIN + "/")) fail(name, `JSON-LD ${key} points outside ${ORIGIN}: ${value}`);
        else if (/\.(png|svg|jpe?g|webp)$/.test(value) && !existsSync(join(ROOT, value.slice(ORIGIN.length)))) fail(name, `JSON-LD ${key} file does not exist: ${value}`);
      }
    }
  }
  const visible = textOf(noScript);
  for (const node of ldNodesOnPage) {
    const types = [].concat(node["@type"] ?? []);
    if (types.includes("Organization")) {
      for (const key of ["name", "legalName", "url", "logo", "description"]) if (!node[key]) fail(name, `Organization JSON-LD is missing "${key}"`);
      if (node.url !== ORIGIN + "/") fail(name, `Organization url should be ${ORIGIN}/, not ${node.url}`);
      for (const key of ["name", "legalName"]) if (node[key] && !visible.includes(node[key])) fail(name, `Organization ${key} "${node[key]}" does not appear on the page`);
    }
    if (types.includes("Service")) {
      if (node.url !== pageInfo.get(file).canonical) fail(name, `Service url (${node.url}) must equal the canonical URL`);
      if (!node.description || !visible.includes(node.description)) fail(name, "Service description must appear, word for word, in the visible page text");
      if (!node.name || !headings.some((h) => h.text === node.name)) fail(name, `Service name "${node.name}" must match a heading on the page`);
    }
  }
  if (name === "index.html" && !ldNodesOnPage.some((n) => [].concat(n["@type"]).includes("Organization"))) fail(name, "the home page needs Organization JSON-LD");

  /* dates: a "Last updated" line must hold a real date that is not in the future */
  for (const m of noScript.matchAll(/Last updated:\s*([^<]*)</g)) {
    const date = parseLongDate(decode(m[1]).trim());
    if (!date) fail(name, `"Last updated: ${m[1].trim()}" is not a date such as "24 November 2026"`);
    else if (+date > endOfTodayUtc()) fail(name, `"Last updated" is in the future: ${m[1].trim()}`);
  }

  /* things that must not ship: always enforced, because the site is published */
  const bodyText = visible;
  const placeholders = [...bodyText.matchAll(/\[[^\]]*(to be|to follow|TBC|publication date)[^\]]*\]|\b(TODO|FIXME|lorem ipsum)\b/gi)].map((m) => m[0]);
  if (/class="owner-decision"/.test(noScript)) fail(name, "owner-decision boxes are still present");
  if (/class="draft-banner"/.test(noScript)) fail(name, "draft banner is still present");
  for (const p of placeholders) fail(name, `unresolved placeholder ${p}`);
  if (/Photograph to follow|photograph of .* to follow/i.test(raw)) warn(name, "a placeholder photograph is still in use");
}

/* ------------------------------------------------- site-wide: duplicates and reachability */
const publicPages = [...pageInfo.entries()].filter(([, i]) => !i.isNotFoundPage);
for (const field of ["title", "description", "h1", "canonical"]) {
  const seenValues = new Map();
  for (const [, info] of publicPages) {
    const v = info[field];
    if (!v) continue;
    if (seenValues.has(v)) fail(info.name, `${field} duplicates ${seenValues.get(v)}: "${v}"`);
    else seenValues.set(v, info.name);
  }
}
const home = join(ROOT, "index.html");
const reached = new Set([home]);
for (const queue = [home]; queue.length; ) {
  for (const next of linksFrom.get(queue.shift()) ?? []) if (!reached.has(next)) { reached.add(next); queue.push(next); }
}
for (const [file, info] of publicPages) if (!reached.has(file)) fail(info.name, "no crawlable link path from the home page reaches this page (orphan)");

/* ---------------------------------------------------------- site-wide files */
const textFiles = files.filter((f) => /\.(html|css|js|xml|txt|svg)$/.test(f) && !f.includes(`${sep}fonts${sep}`));
for (const f of textFiles) {
  const t = readFileSync(f, "utf8");
  if (/(api[_-]?key|master[_ -]?key|client[_ -]?secret|password\s*[:=])/i.test(t)) fail(rel(f), "contains something that looks like a credential keyword");
  for (const m of t.matchAll(/https?:\/\/formspree\.io\/[^\s"')]+/g)) {
    if (m[0] !== FORM_ENDPOINT && !/formspree\.io\/legal\/privacy-policy$/.test(m[0])) fail(rel(f), `unexpected Formspree URL ${m[0]}`);
  }
  if (TRACKERS.test(t)) fail(rel(f), `mentions an analytics, advertising or third-party font service (${t.match(TRACKERS)[0]}); the privacy notice says there are none`);
  if (WRONG_ORIGINS.test(t)) fail(rel(f), `mentions a non-preferred origin (${t.match(WRONG_ORIGINS)[0]}); use ${ORIGIN}`);
  if (/\.css$/.test(f) && /@import|url\(\s*["']?(https?:)?\/\//i.test(t)) fail(rel(f), "CSS loads a resource from another host");
  if (/(^|\/)_headers$|\.htaccess$/.test(f)) warn(rel(f), "GitHub Pages ignores this file; robots rules cannot be set with headers here");
  if (/x-robots-tag/i.test(t)) fail(rel(f), "mentions X-Robots-Tag, which GitHub Pages cannot send; use a robots meta tag");
}

/* sitemap: only live, canonical, indexable pages, in the preferred form, each once */
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const inSitemap = new Set();
for (const loc of sitemapUrls) {
  if (inSitemap.has(loc)) fail("sitemap.xml", `${loc} is listed twice`);
  inSitemap.add(loc);
  let u;
  try { u = new URL(loc); } catch { fail("sitemap.xml", `${loc} is not an absolute URL`); continue; }
  if (u.origin !== ORIGIN) { fail("sitemap.xml", `${loc} is not on ${ORIGIN}`); continue; }
  if (u.search || u.hash) fail("sitemap.xml", `${loc} has a query string or fragment`);
  if (!u.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(u.pathname)) fail("sitemap.xml", `${loc} is missing its trailing slash`);
  const local = join(ROOT, u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname);
  if (!existsSync(local)) { fail("sitemap.xml", `${loc} does not exist in site/`); continue; }
  const info = pageInfo.get(local);
  if (!info) fail("sitemap.xml", `${loc} is not an HTML page`);
  else if (info.isNotFoundPage || info.noindex) fail("sitemap.xml", `${loc} is a noindex page and must not be listed`);
  else if (info.canonical !== loc) fail("sitemap.xml", `${loc} is listed, but the page's canonical URL is ${info.canonical}`);
}
for (const [, info] of publicPages) {
  if (info.canonical && !inSitemap.has(info.canonical)) fail("sitemap.xml", `${info.canonical} is missing from the sitemap`);
}
for (const m of sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(m[1]) || isNaN(Date.parse(m[1]))) fail("sitemap.xml", `<lastmod>${m[1]}</lastmod> is not a W3C date`);
  else if (Date.parse(m[1]) > endOfTodayUtc()) fail("sitemap.xml", `<lastmod>${m[1]}</lastmod> is in the future`);
}

/* robots.txt: crawlable, with nothing disallowed, pointing at the sitemap */
const robotsTxt = readFileSync(join(ROOT, "robots.txt"), "utf8");
const robotsRules = robotsTxt.split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter(Boolean);
if (!robotsRules.some((l) => /^user-agent:\s*\*$/i.test(l))) fail("robots.txt", "needs a 'User-agent: *' group");
for (const rule of robotsRules.filter((l) => /^disallow:/i.test(l))) {
  if (rule.replace(/^disallow:\s*/i, "") !== "") fail("robots.txt", `"${rule}" blocks crawling. Do not use robots.txt to keep pages or assets out of search: crawlers must fetch a page to see its noindex tag, and need CSS, JavaScript and images to render it`);
}
if (robotsRules.some((l) => /^noindex:/i.test(l))) fail("robots.txt", "a Noindex line is not supported by Google; use a robots meta tag");
const sitemapLines = robotsRules.filter((l) => /^sitemap:/i.test(l)).map((l) => l.replace(/^sitemap:\s*/i, ""));
if (sitemapLines.length !== 1 || sitemapLines[0] !== `${ORIGIN}/sitemap.xml`) fail("robots.txt", `must contain exactly one Sitemap line, ${ORIGIN}/sitemap.xml`);

for (const required of ["favicon.ico", "assets/img/favicon.svg", "assets/img/apple-touch-icon.png", "assets/img/og-image.png", ".nojekyll"]) {
  if (!existsSync(join(ROOT, required))) fail(required, "file is missing");
}

/* ------------------------------------------------------------- external links */
if (EXTERNAL) {
  const results = await Promise.all([...externalLinks.entries()].map(async ([url, from]) => {
    const attempt = async (method) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(url, { method, redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "zastras-site-check/1.0" } });
        return res.status;
      } finally { clearTimeout(timer); }
    };
    try {
      let status = await attempt("HEAD");
      if (status === 405 || status === 403 || status === 404) status = await attempt("GET");
      return { url, from, status };
    } catch (e) { return { url, from, status: `error: ${e.name}` }; }
  }));
  for (const r of results) {
    const ok = typeof r.status === "number" && r.status < 400;
    console.log(`${ok ? "ok  " : "FAIL"} ${r.status}  ${r.url}`);
    if (!ok) fail([...r.from].join(", "), `external link failed (${r.status}): ${r.url}`);
  }
} else if (externalLinks.size) {
  console.log(`${externalLinks.size} external link(s) not requested (use --external): ${[...externalLinks.keys()].join(", ")}`);
}

/* ------------------------------------------------------------------- report */
console.log(`\nChecked ${pages.length} page(s): ${publicPages.length} public, ${pages.length - publicPages.length} not-found.`);
if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); warnings.forEach((w) => console.log("  - " + w)); }
if (failures.length) { console.log(`\nFAILED (${failures.length}):`); failures.forEach((f) => console.log("  x " + f)); process.exit(1); }
console.log("\nAll checks passed.");
