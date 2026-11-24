#!/usr/bin/env node
/**
 * Read-only DNS and HTTPS checks for the zastras.uk cutover. Node 18+, no dependencies.
 * It never changes anything: it only asks public DNS-over-HTTPS (dns.google) and the public web.
 *
 *   node scripts/verify-cutover.mjs --before   Before the switch: snapshot the records and confirm the mail records are as expected.
 *   node scripts/verify-cutover.mjs --after    After the switch: confirm GitHub Pages records, preserved mail records, HTTPS, redirects and pages.
 *   node scripts/verify-cutover.mjs --after --indexable   Final check after the noindex tags are removed.
 *
 * See docs/CUTOVER.md. DNS answers can lag for up to the record's TTL, so re-run until stable.
 */
const DOMAIN = "zastras.uk";
const WWW = `www.${DOMAIN}`;
const GITHUB_A = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"];
const GITHUB_AAAA = ["2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153"];
const WWW_TARGET = "zastras.github.io.";
const EXPECT_MX = ["1 smtp.google.com."];
const EXPECT_SPF = "v=spf1 include:_spf.google.com ~all";
const EXPECT_DKIM_PREFIX = "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz61yeLjz3ePAC";
const LEGAL = "Company number SC832156";

const args = new Set(process.argv.slice(2));
const AFTER = args.has("--after");
const BEFORE = args.has("--before") || !AFTER;
const INDEXABLE = args.has("--indexable");

let failures = 0, warnings = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { failures++; console.log(`  FAIL  ${m}`); };
const warn = (m) => { warnings++; console.log(`  warn  ${m}`); };
const info = (m) => console.log(`  info  ${m}`);

async function doh(name, type) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: "application/dns-json" } });
  const j = await res.json();
  const answers = (j.Answer || []).filter((a) => a.type === { A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16, NS: 2 }[type]);
  return { status: j.Status, data: answers.map((a) => a.data.replace(/^"|"$/g, "").replace(/" "/g, "")), ttl: answers.map((a) => a.TTL), all: j.Answer || [] };
}
const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

console.log(`\n${AFTER ? "AFTER the switch" : "BEFORE the switch"}: ${DOMAIN}  (${new Date().toISOString()})\n`);

/* ------------------------------------------------------------------ DNS */
console.log("Web records");
const a = await doh(DOMAIN, "A"), aaaa = await doh(DOMAIN, "AAAA"), www = await doh(WWW, "CNAME");
info(`${DOMAIN} A     ${a.data.join(", ") || "none"}  (TTL ${a.ttl.join(", ") || "-"})`);
info(`${DOMAIN} AAAA  ${aaaa.data.join(", ") || "none"}`);
info(`${WWW} CNAME ${www.data.join(", ") || "none"}  (TTL ${www.ttl.join(", ") || "-"})`);
if (AFTER) {
  same(a.data, GITHUB_A) ? ok("apex A records are exactly the four GitHub Pages addresses") : bad(`apex A should be exactly ${GITHUB_A.join(", ")} (no Squarespace addresses left)`);
  if (aaaa.data.length === 0) warn("no AAAA records (optional but recommended by GitHub)");
  else same(aaaa.data, GITHUB_AAAA) ? ok("apex AAAA records are exactly the four GitHub Pages addresses") : bad(`apex AAAA should be exactly ${GITHUB_AAAA.join(", ")}`);
  www.data.length === 1 && www.data[0] === WWW_TARGET ? ok(`www CNAME points at ${WWW_TARGET} (no repository name)`) : bad(`www CNAME should be ${WWW_TARGET}, found ${www.data.join(", ") || "nothing"}`);
  const wild = await doh(`zz-wildcard-check-${Date.now()}.${DOMAIN}`, "A");
  wild.status === 3 ? ok("no wildcard record (random subdomain does not resolve)") : bad("a wildcard record exists; GitHub advises against it");
} else {
  info("expected today: Squarespace addresses and ext-sq.squarespace.com. (these are the records that will be replaced)");
}

console.log("\nRecords that must NOT change (email and delegation)");
const mx = await doh(DOMAIN, "MX"), txt = await doh(DOMAIN, "TXT"), dkim = await doh(`google._domainkey.${DOMAIN}`, "TXT"), ns = await doh(DOMAIN, "NS"), dmarc = await doh(`_dmarc.${DOMAIN}`, "TXT");
same(mx.data, EXPECT_MX) ? ok(`MX ${mx.data.join(", ")}`) : bad(`MX changed: expected ${EXPECT_MX.join(", ")}, found ${mx.data.join(", ") || "nothing"}`);
txt.data.includes(EXPECT_SPF) ? ok("SPF record present and unchanged") : bad(`SPF missing or changed: ${txt.data.join(" | ") || "nothing"}`);
dkim.data.some((d) => d.startsWith(EXPECT_DKIM_PREFIX)) ? ok("DKIM record (google._domainkey) present and unchanged") : bad("DKIM record missing or changed");
ns.data.length === 4 && ns.data.every((n) => /googledomains\.com\.$/.test(n)) ? ok(`name servers unchanged (${ns.data.length} googledomains.com)`) : bad(`name servers changed: ${ns.data.join(", ")}`);
dmarc.data.length ? info(`DMARC record now present: ${dmarc.data[0].slice(0, 80)}`) : info("no DMARC record (none existed before; adding one is a separate change)");
const extraTxt = txt.data.filter((d) => d !== EXPECT_SPF);
if (extraTxt.length) info(`other apex TXT records: ${extraTxt.map((t) => t.slice(0, 60)).join(" | ")}`);
const challenge = await doh(`_github-pages-challenge-zastras.${DOMAIN}`, "TXT");
info(challenge.data.length ? `GitHub domain-verification TXT present: ${challenge.data[0].slice(0, 40)}...` : "GitHub domain-verification TXT not present yet");
if (AFTER && !challenge.data.length) warn("keep the GitHub verification TXT record in place once verified");

/* ------------------------------------------------------------------ Web */
if (AFTER) {
  console.log("\nHTTPS and redirects");
  const get = async (url, opts = {}) => {
    try { return await fetch(url, { redirect: "manual", headers: { "user-agent": "zastras-cutover-check/1.0" }, ...opts }); } catch (e) { return { error: e.cause?.code || e.message }; }
  };
  const home = await get(`https://${DOMAIN}/`);
  if (home.error) bad(`https://${DOMAIN}/ failed: ${home.error} (certificate not issued yet, or DNS not propagated)`);
  else {
    const html = await home.text();
    home.status === 200 ? ok(`https://${DOMAIN}/ returns 200`) : bad(`https://${DOMAIN}/ returned ${home.status}`);
    /Squarespace/i.test(home.headers.get("server") || "") ? bad("still served by Squarespace") : ok("not served by Squarespace");
    /<title>[^<]*Zastras Accelerate/.test(html) ? ok("new site title present") : bad("new site not found at the apex (is this still the old page?)");
    html.includes(LEGAL) ? ok("legal footer present") : bad("legal footer missing");
    /<link rel="canonical" href="https:\/\/zastras\.uk\/">/.test(html) ? ok("canonical is https://zastras.uk/") : bad("canonical wrong");
    const noindex = /<meta name="robots"[^>]*noindex/i.test(html);
    INDEXABLE ? (noindex ? bad("noindex is still present (remove the PREVIEW-NOINDEX lines)") : ok("no noindex: page can be indexed")) : (noindex ? info("noindex present, as intended until the final step") : warn("noindex is already gone"));
  }
  const wwwRes = await get(`https://${WWW}/`);
  if (wwwRes.error) bad(`https://${WWW}/ failed: ${wwwRes.error}`);
  else (wwwRes.status === 301 || wwwRes.status === 302) && (wwwRes.headers.get("location") || "").startsWith(`https://${DOMAIN}`) ? ok(`www redirects (${wwwRes.status}) to ${wwwRes.headers.get("location")}`) : bad(`www should redirect to https://${DOMAIN}/ ; got ${wwwRes.status} ${wwwRes.headers.get("location") || ""}`);
  const http = await get(`http://${DOMAIN}/`);
  http.error ? warn(`http://${DOMAIN}/ failed: ${http.error}`) : (http.status === 301 && (http.headers.get("location") || "").startsWith("https://")) ? ok("http redirects to https") : bad(`http should redirect to https; got ${http.status} ${http.headers.get("location") || ""} (is Enforce HTTPS ticked?)`);

  console.log("\nPages and assets");
  for (const [path, type] of [["privacy/", "text/html"], ["robots.txt", "text/plain"], ["sitemap.xml", "xml"], ["assets/img/og-image.png", "image/png"], ["favicon.ico", "icon"], ["assets/css/main.css", "text/css"], ["assets/js/main.js", "javascript"], ["assets/fonts/geist-latin-wght.woff2", "font/woff2"], ["assets/img/team/lex-sobrinho-1200.webp", "image/webp"], ["assets/img/team/applied-ai-specialist-1200.webp", "image/webp"]]) {
    const r = await get(`https://${DOMAIN}/${path}`, { redirect: "follow" });
    r.error ? bad(`/${path}: ${r.error}`) : r.status === 200 && (r.headers.get("content-type") || "").includes(type.replace("icon", "icon").replace("xml", "xml")) ? ok(`/${path} 200 ${r.headers.get("content-type")}`) : bad(`/${path}: ${r.status} ${r.headers.get("content-type")}`);
  }
  const missing = await get(`https://${DOMAIN}/does-not-exist/`, { redirect: "follow" });
  !missing.error && missing.status === 404 && /Page not found/.test(await missing.text()) ? ok("missing pages show the site's own 404 page") : bad("404 page not served");
  console.log("\nStill to do by hand: submit one labelled test enquiry from https://zastras.uk/, then set Formspree 'Restrict to Domain' to zastras.uk and test again.");
}

console.log(`\n${failures ? `${failures} problem(s)` : "No problems"}${warnings ? `, ${warnings} warning(s)` : ""}.`);
process.exit(failures ? 1 : 0);
