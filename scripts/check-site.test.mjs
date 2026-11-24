/**
 * Proves that scripts/check-site.mjs fails when the site regains something that must not ship.
 * Each case copies site/ to a temporary folder, makes one deliberate mistake, and expects the check to
 * fail with a message about that mistake. The first case confirms the untouched site passes.
 *
 *   node --test scripts/check-site.test.mjs
 *
 * Node 18+, no dependencies.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, "..", "site");
const CHECK = resolve(HERE, "check-site.mjs");

/** Copy the site, apply `edit(read, write)`, run the check, return { status, output }. */
function runWith(edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "zastras-site-"));
  try {
    cpSync(SITE, dir, { recursive: true });
    edit(
      (file) => readFileSync(join(dir, file), "utf8"),
      (file, text) => writeFileSync(join(dir, file), text),
    );
    const res = spawnSync(process.execPath, [CHECK, "--root", dir], { encoding: "utf8" });
    return { status: res.status, output: res.stdout + res.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The check must fail, and its report must match `pattern`. */
function expectFailure(label, edit, pattern) {
  test(label, () => {
    const { status, output } = runWith(edit);
    assert.equal(status, 1, `expected the check to fail, but it passed:\n${output}`);
    assert.match(output, pattern);
  });
}

const replaceIn = (file, from, to) => (read, write) => {
  const text = read(file);
  assert.ok(text.includes(from), `test setup: ${file} no longer contains ${JSON.stringify(from)}`);
  write(file, text.replace(from, to));
};

test("the site as committed passes", () => {
  const { status, output } = runWith();
  assert.equal(status, 0, output);
});

/* ---- indexing ----------------------------------------------------------------------------- */
expectFailure("noindex on the home page fails", replaceIn("index.html", '<link rel="canonical" href="https://zastras.uk/">', '<link rel="canonical" href="https://zastras.uk/">\n<meta name="robots" content="noindex, nofollow">'), /index\.html: robots meta .*blocks indexing/);
expectFailure("noindex on the privacy page fails", replaceIn("privacy/index.html", "</head>", '<meta name="robots" content="noindex"></head>'), /privacy\/index\.html: robots meta/);
expectFailure('robots "none" fails', replaceIn("retainer/index.html", "</head>", '<meta name="robots" content="none"></head>'), /retainer\/index\.html: robots meta/);
expectFailure("a googlebot-only noindex fails", replaceIn("index.html", "</head>", '<meta name="googlebot" content="noindex"></head>'), /index\.html: robots meta/);
expectFailure("the PREVIEW-NOINDEX marker fails", replaceIn("index.html", "<head>", "<head>\n<!-- PREVIEW-NOINDEX: temporary -->"), /PREVIEW-NOINDEX marker/);
expectFailure("the 404 page losing its noindex fails", replaceIn("404.html", '<meta name="robots" content="noindex">', ""), /404\.html: the 404 page must keep/);

/* ---- draft and placeholder text ----------------------------------------------------------- */
expectFailure("a draft banner fails", replaceIn("privacy/index.html", '<p class="label">Last updated', '<p class="draft-banner" role="note">Draft</p><p class="label">Last updated'), /draft banner is still present/);
expectFailure("a [publication date] placeholder fails", replaceIn("privacy/index.html", "Last updated: 24 November 2026", "Last updated: [publication date]"), /unresolved placeholder|is not a date/);
expectFailure("a future 'Last updated' date fails", replaceIn("privacy/index.html", "Last updated: 24 November 2026", "Last updated: 1 January 2999"), /in the future/);
expectFailure("an owner-decision box fails", replaceIn("privacy/index.html", '<p class="label">Last updated', '<div class="owner-decision">Decide</div><p class="label">Last updated'), /owner-decision boxes/);

/* ---- canonical, sitemap and robots.txt ---------------------------------------------------- */
expectFailure("a canonical that disagrees with the page fails", replaceIn("retainer/index.html", 'rel="canonical" href="https://zastras.uk/retainer/"', 'rel="canonical" href="https://zastras.uk/privacy/"'), /canonical is https:\/\/zastras\.uk\/privacy\//);
expectFailure("a www canonical fails", replaceIn("index.html", 'rel="canonical" href="https://zastras.uk/"', 'rel="canonical" href="https://www.zastras.uk/"'), /non-preferred origin|canonical is/);
expectFailure("a page missing from the sitemap fails", replaceIn("sitemap.xml", "  <url>\n    <loc>https://zastras.uk/privacy/</loc>\n  </url>\n", ""), /privacy\/ is missing from the sitemap/);
expectFailure("a sitemap entry that does not exist fails", replaceIn("sitemap.xml", "</urlset>", "<url><loc>https://zastras.uk/nowhere/</loc></url></urlset>"), /does not exist in site/);
expectFailure("the 404 page in the sitemap fails", replaceIn("sitemap.xml", "</urlset>", "<url><loc>https://zastras.uk/404.html</loc></url></urlset>"), /noindex page and must not be listed/);
expectFailure("a duplicate sitemap entry fails", replaceIn("sitemap.xml", "</urlset>", "<url><loc>https://zastras.uk/</loc></url></urlset>"), /listed twice/);
expectFailure("a future lastmod fails", replaceIn("sitemap.xml", "<loc>https://zastras.uk/</loc>", "<loc>https://zastras.uk/</loc><lastmod>2999-01-01</lastmod>"), /lastmod.*future/);
expectFailure("robots.txt blocking assets fails", replaceIn("robots.txt", "Allow: /", "Disallow: /assets/"), /blocks crawling/);
expectFailure("robots.txt without the sitemap line fails", replaceIn("robots.txt", "Sitemap: https://zastras.uk/sitemap.xml", ""), /exactly one Sitemap line/);

/* ---- metadata ----------------------------------------------------------------------------- */
expectFailure("a duplicate title fails", (read, write) => {
  const title = read("retainer/index.html").match(/<title>([^<]*)<\/title>/)[1];
  write("privacy/index.html", read("privacy/index.html").replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`));
}, /title duplicates/);
expectFailure("a missing meta description fails", (read, write) => write("privacy/index.html", read("privacy/index.html").replace(/<meta name="description"[^>]*>/, "")), /missing meta description/);
expectFailure("an og:url that differs from the canonical fails", replaceIn("retainer/index.html", 'property="og:url" content="https://zastras.uk/retainer/"', 'property="og:url" content="https://zastras.uk/privacy/"'), /og:url/);
expectFailure("og:image dimensions that do not match the file fail", replaceIn("index.html", 'property="og:image:width" content="1200"', 'property="og:image:width" content="800"'), /og:image is 1200x630/);

/* ---- structured data ---------------------------------------------------------------------- */
expectFailure("JSON-LD that does not parse fails", replaceIn("index.html", '"legalName": "ZASTRAS LTD",', '"legalName": "ZASTRAS LTD" "oops",'), /does not parse/);
expectFailure("a LocalBusiness-family type fails", replaceIn("index.html", '"@type": "Organization"', '"@type": "ProfessionalService"'), /not on the approved list/);
expectFailure("an invented rating fails", replaceIn("index.html", '"legalName": "ZASTRAS LTD",', '"legalName": "ZASTRAS LTD", "aggregateRating": {"@type": "AggregateRating", "ratingValue": 5},'), /aggregateRating/);
expectFailure("a Service description that is not on the page fails", replaceIn("process-review/index.html", '"description": "A focused look', '"description": "An invented look'), /Service description must appear/);
expectFailure("a JSON-LD URL on another host fails", replaceIn("index.html", '"logo": "https://zastras.uk/assets/img/logo-mark-512.png"', '"logo": "https://example.com/logo.png"'), /outside https:\/\/zastras\.uk/);

/* ---- links and privacy posture ------------------------------------------------------------ */
expectFailure("a page nothing links to fails", (read, write) => {
  for (const file of ["index.html", "privacy/index.html", "retainer/index.html", "process-review/index.html"]) {
    write(file, read(file).replace(/<li><a href="(\.\.\/)?one-workflow-pilot\/">[^<]*<\/a><\/li>/g, "").replace(/<a [^>]*href="(\.\.\/)?one-workflow-pilot\/"[^>]*>([^<]*)<\/a>/g, "$2"));
  }
}, /orphan/);
expectFailure("a link to the www host fails", replaceIn("index.html", '<a href="privacy/">privacy notice</a>.</p>\n            </div>', '<a href="https://www.zastras.uk/privacy/">privacy notice</a>.</p>\n            </div>'), /non-preferred origin/);
expectFailure("a link to index.html fails", replaceIn("index.html", '<a href="process-review/">How a process review works</a>', '<a href="process-review/index.html">How a process review works</a>'), /names index\.html/);
expectFailure("a directory link without a trailing slash fails", replaceIn("index.html", '<a href="process-review/">How a process review works</a>', '<a href="process-review">How a process review works</a>'), /trailing slash/);
expectFailure("a third-party script fails", replaceIn("index.html", "</head>", '<script src="https://www.googletagmanager.com/gtag/js?id=G-TEST" async></script></head>'), /third-party resource|analytics/);
expectFailure("a Google Fonts stylesheet fails", replaceIn("index.html", "</head>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"></head>'), /third-party resource|analytics/);
expectFailure("a changed form endpoint fails", replaceIn("index.html", "https://formspree.io/f/maeolban", "https://formspree.io/f/other"), /form action/);
