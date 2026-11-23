#!/usr/bin/env node
/**
 * Checks for the static site in ./site. Node 18+, no dependencies.
 *
 *   node scripts/check-site.mjs                 structure, links, metadata, form and legal-text checks
 *   node scripts/check-site.mjs --external      also request every external link (needs network)
 *   node scripts/check-site.mjs --production    also fail on anything that must not ship: noindex tags,
 *                                               "owner decision" boxes, bracketed placeholders, draft banners
 *
 * It is deliberately small. It catches the mistakes that are easy to make when editing by hand
 * (broken links and anchors, missing alt text, a changed form endpoint, a dropped legal line) and
 * does not try to replace a browser or a screen reader. See docs/REVIEW.md for what was checked by hand.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "site");
const ORIGIN = "https://zastras.uk";
const FORM_ENDPOINT = "https://formspree.io/f/maeolban";
const LEGAL_TEXT =
  "Zastras Practical AI is a service of ZASTRAS LTD. Registered in Scotland. Company number SC832156. Registered office: 48 West George Street, 2nd Floor, Glasgow, Scotland, G2 1BP.";

const args = new Set(process.argv.slice(2));
const PRODUCTION = args.has("--production");
const EXTERNAL = args.has("--external");

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
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
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

    const canonical = tags(html, "link").find((t) => t.attrs.rel === "canonical")?.attrs.href;
    if (!canonical) fail(name, "missing canonical link");
    else {
      const expectedPath = name === "index.html" ? "/" : "/" + name.replace(/index\.html$/, "");
      if (canonical !== ORIGIN + expectedPath) fail(name, `canonical is ${canonical}, expected ${ORIGIN + expectedPath}`);
    }
    for (const key of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
      if (!meta(key, "property")) fail(name, `missing ${key}`);
    }
    if (!meta("twitter:card")) fail(name, "missing twitter:card");
    const og = meta("og:image", "property");
    if (og) {
      if (!og.startsWith(ORIGIN + "/")) fail(name, `og:image should be an absolute ${ORIGIN} URL`);
      else if (!existsSync(join(ROOT, og.slice(ORIGIN.length)))) fail(name, `og:image file not found in site/: ${og}`);
    }
    if (!tags(html, "link").some((t) => (t.attrs.rel || "").includes("icon"))) fail(name, "missing favicon link");
  }

  /* indexing state */
  const robots = meta("robots") || "";
  const noindex = /noindex/i.test(robots);
  if (PRODUCTION && noindex && !isNotFoundPage) fail(name, "noindex is still set (remove the PREVIEW-NOINDEX line before launch)");
  if (!PRODUCTION && !noindex && !isNotFoundPage) warn(name, "no noindex tag: this page would be indexed if deployed");

  /* headings */
  const headings = [...noScript.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: +m[1], text: textOf(m[2]) }));
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length !== 1) fail(name, `expected exactly one <h1>, found ${h1s.length}`);
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

  for (const { tag, url } of refs) {
    if (/^(mailto:|tel:|javascript:|data:)/i.test(url)) continue;
    if (/^https?:\/\//i.test(url)) {
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

  /* things that must not ship */
  const bodyText = textOf(noScript);
  const hasOwnerBoxes = /class="owner-decision"/.test(noScript);
  const hasDraftBanner = /class="draft-banner"/.test(noScript);
  const placeholders = [...bodyText.matchAll(/\[[^\]]*(to be|to follow|TBC)[^\]]*\]/gi)].map((m) => m[0]);
  if (PRODUCTION) {
    if (hasOwnerBoxes) fail(name, "owner-decision boxes are still present");
    if (hasDraftBanner) fail(name, "draft banner is still present");
    for (const p of placeholders) fail(name, `unresolved placeholder ${p}`);
    if (/PREVIEW-NOINDEX/.test(raw)) fail(name, "PREVIEW-NOINDEX marker comment is still present");
    if (/Photograph to follow|photograph of .* to follow/i.test(raw)) warn(name, "a placeholder photograph is still in use");
  } else {
    if (hasOwnerBoxes) warn(name, "owner-decision boxes present (expected in draft; blocked by --production)");
    for (const p of placeholders) warn(name, `placeholder ${p} (expected in draft; blocked by --production)`);
  }
}

/* ---------------------------------------------------------- site-wide files */
const textFiles = files.filter((f) => /\.(html|css|js|xml|txt|svg)$/.test(f) && !f.includes(`${sep}fonts${sep}`));
for (const f of textFiles) {
  const t = readFileSync(f, "utf8");
  if (/(api[_-]?key|master[_ -]?key|client[_ -]?secret|password\s*[:=])/i.test(t)) fail(rel(f), "contains something that looks like a credential keyword");
  for (const m of t.matchAll(/https?:\/\/formspree\.io\/[^\s"')]+/g)) {
    if (m[0] !== FORM_ENDPOINT && !/formspree\.io\/legal\/privacy-policy$/.test(m[0])) fail(rel(f), `unexpected Formspree URL ${m[0]}`);
  }
}

const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const u = new URL(m[1]);
  const local = join(ROOT, u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname);
  if (u.origin !== ORIGIN) fail("sitemap.xml", `${m[1]} is not on ${ORIGIN}`);
  else if (!existsSync(local)) fail("sitemap.xml", `${m[1]} does not exist in site/`);
}
for (const page of pages.filter((p) => rel(p) !== "404.html")) {
  const url = ORIGIN + "/" + rel(page).replace(/index\.html$/, "");
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail("sitemap.xml", `${url} is missing from the sitemap`);
}
if (!/Sitemap:\s*https:\/\/zastras\.uk\/sitemap\.xml/.test(readFileSync(join(ROOT, "robots.txt"), "utf8"))) fail("robots.txt", "does not point at the sitemap");
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
console.log(`\nChecked ${pages.length} page(s)${PRODUCTION ? " in production mode" : ""}.`);
if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); warnings.forEach((w) => console.log("  - " + w)); }
if (failures.length) { console.log(`\nFAILED (${failures.length}):`); failures.forEach((f) => console.log("  x " + f)); process.exit(1); }
console.log("\nAll checks passed.");
