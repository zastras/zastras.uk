# Production cutover checklist: zastras.uk

## Status on 24 November 2026: the domain is switched and live; indexing is switched on by the publication pull request

The owner approved the cutover on 23 November 2026 and made the DNS changes himself in Squarespace that evening. On 24 November 2026, at his explicit yes, the Pages custom domain was saved and Enforce HTTPS turned on through the GitHub API. Sections B to E are done and were checked from outside on 24 November 2026 with `node scripts/verify-cutover.mjs --after` ("No problems"), the Pages API and `dig`:

- Apex: four GitHub A records and four AAAA records; `www` is a CNAME to `zastras.github.io.`; all nine at a 300 second TTL. The two Squarespace default records are gone and nothing wildcard exists.
- Email is untouched: MX, SPF, DKIM and the name servers match the "before" snapshot. The domain-verification TXT record is present and the Pages domain state is `verified`.
- `zastras.uk` is the Pages custom domain. The certificate covers `zastras.uk` and `www.zastras.uk` (approved, expires 22 February 2027, renewed automatically by GitHub), and Enforce HTTPS is on. `http://` and `www` both return a 301 to `https://zastras.uk/`. The old preview address `https://zastras.github.io/zastras.uk/` now redirects to the domain.
- The workflow run on `main` is green and `https://zastras.uk/` serves the new site, with the legal footer, the right canonical URL and a 404 page of its own.

**Still to do, in this order:**

1. Contact form on the live domain: send a labelled test, set Formspree *Restrict to Domain* to `zastras.uk` (no `www`), send a second one (Section F).
2. A real inbound and outbound email test on the domain (Sections D and F).
3. Cookie and third-party re-audit on the live domain (Section F).
4. The privacy items that were listed as gating publication, which the owner still has to close: [To-do.md](../To-do.md) lists them (deletion routine in the diary, Formspree's Data Privacy Framework entry re-checked, adviser read, the legitimate-interests assessment signed, two-factor authentication on Formspree and the mailbox). Done in the publication pull request: "Last updated" set, draft banner removed, Companies House re-checked (24 November 2026).
5. Section G: the `noindex` tags are removed by the publication pull request, so search engines can index the site once it is merged and deployed. The checks after the deployment are listed there.
6. Turn on two-factor authentication on the Squarespace account (not set up as of 24 November 2026).

The sections below are kept as the record of what was done, and for rollback. Wording written before the switch ("will", "before you begin") is unchanged.

This checklist covers: preparing the repository, verifying and configuring the domain in GitHub, inventorying and preserving existing DNS, switching the web records, enabling HTTPS, checking everything after the switch, and finally allowing search indexing. It follows [GitHub's current custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) (values below were checked against that page on 23 November 2026; re-check them on the day).

| Required item | Where |
|---|---|
| 1. Approvals | Section A |
| 2. Verify the domain in GitHub and configure the Pages custom domain | Section C |
| 3. Inventory existing DNS before any change | Section B |
| 4. Update the apex and `www` web records | Section D |
| 5. Preserve MX, SPF, DKIM, DMARC and unrelated records | Sections B, D and F |
| 6. Enable and check HTTPS | Section E |
| 7. Check apex, `www` redirect, links, images, metadata and the form | Section F |
| 8. Remove the temporary `noindex` | Section G |

## Things to know before you begin

- **Setting the custom domain makes the preview URL redirect.** As soon as `zastras.uk` is saved as the Pages custom domain, `https://zastras.github.io/zastras.uk/` starts redirecting to `https://zastras.uk`, which still points at Squarespace until DNS is switched. So do Sections C and D in one sitting, with nobody relying on the preview in between.
- **The domain's DNS is hosted at Squarespace Domains** (the name servers observed are Google's legacy `ns-cloud-e1` to `e4.googledomains.com`, which Squarespace Domains inherited). Edit records in *Squarespace, Domains, zastras.uk, DNS settings*. If the default Squarespace records are locked while the domain is connected to the holding page, you may need to disconnect the domain from the Squarespace website (this keeps the registration) or switch to custom records; check Squarespace's DNS help for the current wording of that screen.
- **Email runs on Google.** The MX, SPF and DKIM records below carry it. They are not part of this change and must come out of it exactly as they went in. The Squarespace DNS Settings page shows a banner saying Google Workspace manages this domain and that changes could affect its functionality, which is why only the web records are touched. DNSSEC is off (no DS or DNSKEY records found on 23 November 2026), so there is no signing step to coordinate.
- **Turn on two-factor authentication on the Squarespace account first.** The dashboard was prompting for it on 23 November 2026, and this account controls the domain, so it should not be left on a password alone. Squarespace also asks for the password or a 2FA code before it lets you add, edit or delete a record.
- **DNS changes can take up to 24 hours to propagate**, according to GitHub's documentation, and every record currently has a 4-hour TTL (see Section B). Pick a time when a short interruption to the web page is acceptable. Email is unaffected because no mail record changes.
- **There will be a certificate gap, and Squarespace has set HSTS on the apex.** Squarespace currently sends `Strict-Transport-Security: max-age=15552000` (180 days) for `zastras.uk` and `www.zastras.uk` (observed 23 November 2026, no `includeSubDomains`). GitHub can only issue the certificate for `zastras.uk` after the DNS check passes, which is after the records are switched. Until then, anyone who has visited the Squarespace page in that browser and reaches the new servers gets a hard certificate error with no click-through, and everyone else gets a warning. Plan for it: do the switch at a quiet time, save the repository custom domain (Section C) immediately before the switch so GitHub can begin its DNS check and certificate request as early as possible, and treat the gap as the period from the DNS switch until **Enforce HTTPS** becomes tickable (usually minutes, at most about a day).
- **No `CNAME` file is needed.** The site publishes through a GitHub Actions workflow, and GitHub ignores any `CNAME` file in that case.
- Nothing here needs a secret to be committed to the repository.

---

## A. Approvals and readiness (no DNS involved)

- [x] **Design** approved by the owner on the preview, at desktop and mobile widths (covered by the owner's approval of the cutover on 23 November 2026).
- [x] **Copy** approved, including the three additions made during the build that were not in the brief (see [REVIEW.md](REVIEW.md), "Decisions made on your behalf"). Three further passages were removed at the owner's request on 24 November 2026.
- [x] **Team presentation** approved: Lex's photograph accepted; the applied AI specialist's card keeps the abstract graphic and the title, with no name or photograph until that person agrees.
- [ ] **Privacy notice** approved. Done on 24 November 2026: the hosting section and cookie wording approved and all amber review boxes removed; retention, access and the transfer safeguard written in from the owner's answers of 23 November 2026; the draft banner removed and "Last updated" set to 24 November 2026 in the publication pull request. Still open, and owner-only: the 12-month deletion routine in the diary, Formspree's Data Privacy Framework entry re-checked (it read Active with the UK Extension on 23 November 2026), and a data-protection adviser reading the final text. See [To-do.md](../To-do.md).
- [x] **ICO data protection fee:** the company is on the ICO register (checked on the register on 23 November 2026; details in the internal compliance record). Nothing on the site claims ICO registration. Diary the renewal.
- [ ] **Formspree** confirmed by the owner: the notification inbox and who has access (the Director only, confirmed 23 November 2026; two-factor authentication still to check). Whether Formspree acts as a processor and offers a data processing agreement is a loose end, not a blocker. reCAPTCHA is currently off (see README). A labelled test sent from the preview on 23 November 2026 was confirmed by the owner in both the Formspree dashboard and the notification inbox (domain restriction was off at the time).
- [x] **Companies House** record re-checked on the day: <https://find-and-update.company-information.service.gov.uk/company/SC832156>. Name, number and registered office must match the legal footer exactly. *Matched on 23 and again on 24 November 2026 (ZASTRAS LTD, Active, 48 West George Street, 2nd Floor, Glasgow, G2 1BP).*
- [x] **Public address:** the registered office appears in the footer's legal line only, with no wording that invites visits. No other address is shown.
- [ ] **Publication pull request merged** to `main`, containing the draft banner removal, the "Last updated" date and the removal of the `noindex` tags. The check is now always strict (the `--production` flag is gone), so this must pass with no failures before merging:

  ```bash
  node scripts/check-site.mjs
  node --test scripts/check-site.test.mjs
  ```

- [x] The latest run of the *Check and deploy site* workflow on `main` is green and `https://zastras.uk/` shows the approved content (checked 24 November 2026).

## B. Inventory the existing DNS (before changing anything)

Take a record of everything, so you can restore it exactly.

- [ ] Open *Squarespace, Domains, zastras.uk, DNS settings* and **screenshot or export every record**. Save it somewhere durable (not only in your head).
- [x] Run these from a terminal and keep the output with the screenshot (the observed values are in the table below):

  ```bash
  for t in A AAAA CNAME MX TXT NS CAA; do echo "== zastras.uk $t"; dig +noall +answer zastras.uk $t; done
  for h in www _dmarc google._domainkey _domainconnect; do echo "== $h.zastras.uk"; dig +noall +answer $h.zastras.uk ANY; dig +noall +answer $h.zastras.uk TXT; dig +noall +answer $h.zastras.uk CNAME; done
  ```

- [x] Run the read-only snapshot, which also confirms the mail records are as expected, and keep the output:

  ```bash
  node scripts/verify-cutover.mjs --before
  ```

- [x] Note the **TTL** of each record. On 23 November 2026 the DNS panel showed **4 hrs** for every record except `_domainconnect` (1 hr), and the authoritative name server (`ns-cloud-e1.googledomains.com`) served **14400 seconds (4 hours)** for all of them, `_domainconnect` included. Re-read them from the panel on the day.
- [x] **Give the new records a short TTL, rather than lowering the old ones.** The Squarespace A and `www` records are listed in a separate *Squarespace Defaults* block (see Section D), and it is not confirmed that their TTL can be edited. So create the new GitHub records with a TTL of **300 seconds (5 minutes)**. That makes a rollback quick for anyone who has already cached the new answers. Visitors who cached the old Squarespace answer keep it for up to 4 hours after the switch; that is harmless, because they simply keep seeing the holding page until it expires. Records restored during a rollback come back at 4 hours.

**What was observed on 23 November 2026** (by `dig`; confirm against the DNS panel, which is the source of truth):

| Name | Type | TTL | Value observed | Action at cutover |
|---|---|---|---|---|
| `zastras.uk` | A | 14400 | `198.185.159.145` (Squarespace) | **Replace** with the four GitHub addresses in Section D |
| `zastras.uk` | AAAA | n/a | none | **Add** the four GitHub IPv6 addresses (optional, recommended by GitHub) |
| `www.zastras.uk` | CNAME | 14400 | `ext-sq.squarespace.com.` | **Replace** with `zastras.github.io.` |
| `zastras.uk` | MX | 14400 | `1 smtp.google.com.` | **Keep unchanged** |
| `zastras.uk` | TXT (SPF) | 14400 | `"v=spf1 include:_spf.google.com ~all"` | **Keep unchanged** |
| `google._domainkey.zastras.uk` | TXT (DKIM) | 14400 | `"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz61yeLjz3ePAC…"` (full key in the panel) | **Keep unchanged** |
| `_dmarc.zastras.uk` | TXT | n/a | none found | Nothing to preserve (see "DMARC" below) |
| `_domainconnect.zastras.uk` | CNAME | 14400 | `_domainconnect.domains.squarespace.com.` | Leave as is (Squarespace's one-click DNS helper; harmless) |
| `zastras.uk` | NS | 14400 | `ns-cloud-e1` to `e4.googledomains.com.` | **Do not change** |
| `zastras.uk` | CAA | n/a | none found | Nothing to preserve |
| `_github-pages-challenge-zastras.zastras.uk` | TXT | n/a | none yet | **Add** in Section C (domain verification) |

Any record in the panel that is not in this table must also be kept unless you can say what it is for and that it is no longer needed.

## C. Verify the domain in GitHub and configure the Pages custom domain

Verifying first stops anyone else from claiming the domain for their own Pages site. Do this in one sitting with Section D.

- [x] **Verify the domain** for the `zastras` organisation: *github.com, zastras organisation, Settings, Pages, Add a domain*, enter `zastras.uk`. GitHub shows a TXT record to add, of the form `_github-pages-challenge-zastras.zastras.uk` with a value GitHub gives you. Add exactly that TXT record in Squarespace DNS (this is additive and does not affect the website or email): *Squarespace, Domains, zastras.uk, DNS, DNS Settings, Custom records, Add record*, Type `TXT`, Name `_github-pages-challenge-zastras` (the name only, without `.zastras.uk`), Data the value GitHub shows, pasted as given with no extra quotation marks. Do not touch the existing `@` SPF record. Wait for it to resolve (`dig +short _github-pages-challenge-zastras.zastras.uk TXT`), then in GitHub use the kebab menu next to the domain, *Continue verifying*, then *Verify*. Keep the TXT record afterwards: GitHub re-checks it periodically. *Done: the Pages API reports the domain state as `verified` (24 November 2026).*
- [x] In the repository, *Settings, Pages, Custom domain*: enter **`zastras.uk`** (the apex) and save. Using the apex as the custom domain means GitHub redirects `www.zastras.uk` to `zastras.uk` once both DNS records exist. *Done on 24 November 2026.*
- [x] Expect a "DNS check unsuccessful" message at this point. That is normal until Section D is done. *It cleared once Section D was done.*

## D. Switch the web records

In Squarespace DNS:

- [x] **Know the panel layout** (as pasted on 23 November 2026, *Squarespace, Domains, zastras.uk, DNS, DNS Settings*). Records are in three blocks:
  - **Squarespace Defaults:** `A @ 198.185.159.145` and `CNAME www ext-sq.squarespace.com`. **These are the two to remove.**
  - **Squarespace Domain Connect:** `CNAME _domainconnect`. Leave it.
  - **Custom records:** `MX @ 1 smtp.google.com`, `TXT @` (SPF) and `TXT google._domainkey` (DKIM). Leave all three. New records are added here with *Add record*.

  The panel shows CNAME data without a trailing dot, so enter the `www` target as `zastras.github.io` (no dot).
- [x] **Remove** the two *Squarespace Defaults* records (the `@` A record and the `www` CNAME). Squarespace's help says removing the defaults disconnects the domain from the Squarespace site, which is the intent here (it also stops any Squarespace Pay Links on the domain, so confirm there are none). It is **not confirmed** whether the panel lets you delete these two rows individually or only through the preset; if the buttons are not obvious, stop and look at the *Website* tab of the domain before improvising. A `www` CNAME cannot coexist with other `www` records, so delete the old one before adding the new one. Leave every other record alone. *Done: the apex A set is exactly the four GitHub addresses and `www` is the new CNAME.*
- [x] **Add four A records** for `@`:

  | Type | Host | Value |
  |---|---|---|
  | A | `@` | `185.199.108.153` |
  | A | `@` | `185.199.109.153` |
  | A | `@` | `185.199.110.153` |
  | A | `@` | `185.199.111.153` |

- [x] **Add four AAAA records** for `@` (recommended by GitHub):

  | Type | Host | Value |
  |---|---|---|
  | AAAA | `@` | `2606:50c0:8000::153` |
  | AAAA | `@` | `2606:50c0:8001::153` |
  | AAAA | `@` | `2606:50c0:8002::153` |
  | AAAA | `@` | `2606:50c0:8003::153` |

- [x] **Add one CNAME** for `www`:

  | Type | Host | Value |
  |---|---|---|
  | CNAME | `www` | `zastras.github.io.` |

  The target is the organisation's Pages domain **without the repository name**, and not the `*.pages.github.io` address shown in the settings. Never point `www` at the apex.
- [x] On each of the nine new records, set the **TTL to 300 seconds** if the form allows it (the default for custom records is 4 hours). Leave *Priority* as it is (not used for A, AAAA or CNAME). *Done: all nine show 300 on 24 November 2026.*
- [x] Do **not** add wildcard (`*`) records. GitHub advises against them because they invite domain takeover. *Verified: a random subdomain does not resolve.*
- [x] Confirm the records resolve (allow time to propagate):

  ```bash
  dig +noall +answer zastras.uk A        # four 185.199.10x.153 addresses
  dig +noall +answer zastras.uk AAAA     # four 2606:50c0:800x::153 addresses
  dig +noall +answer www.zastras.uk      # zastras.github.io. then GitHub addresses
  ```

- [x] Run the verifier, which checks the web records, the preserved mail records, HTTPS, redirects and the pages in one go (re-run until it is clean; DNS can lag for up to a TTL): *Run on 24 November 2026: no problems.*

  ```bash
  node scripts/verify-cutover.mjs --after
  ```

- [ ] **Email still intact:** the verifier checks MX, SPF, DKIM and the name servers; also re-run the lookups from Section B if you want to see them yourself. They must match the "before" output exactly. Send a test email to the domain from outside, and one from it, and confirm both arrive. *Records checked on 24 November 2026 (the verifier reports MX, SPF, DKIM and the name servers unchanged). The real inbound and outbound test emails have not been sent yet.*

## E. Enable and check HTTPS

- [x] In *Settings, Pages*, wait for the green **DNS check successful** message. GitHub then provisions a certificate; this can take from minutes up to about a day. *Done: certificate approved for `zastras.uk` and `www.zastras.uk`, expires 22 February 2027.*
- [x] Tick **Enforce HTTPS** as soon as it becomes available. *Done on 24 November 2026.*
- [x] Check the certificate: open `https://zastras.uk` and confirm the padlock, the certificate covers `zastras.uk`, and there are no mixed-content warnings (the page requests nothing from other hosts, so there should be none). *Verified from outside: the page answers over HTTPS with a valid certificate and requests nothing from other hosts.*
- [x] `http://zastras.uk` and `http://www.zastras.uk` both redirect to `https://zastras.uk`. *Verified (301).*

## F. Check everything after the switch

Use a private window or `curl`, so you see what a new visitor sees.

- [x] **Apex:** `https://zastras.uk` loads the new site, not the Squarespace page. *Verified.*
- [x] **www redirect:** `curl -sI https://www.zastras.uk | head` shows a `301` to `https://zastras.uk/`. *Verified.*
- [ ] **Internal links:** every item in the header and footer navigation scrolls to the right section; the privacy link works from the home page and the privacy page links back; the "Discuss a workflow" and "How we work" buttons work. Run `node scripts/check-site.mjs --external` for a mechanical pass.
- [ ] **Images and fonts:** nothing 404s (browser developer tools, Network tab); the logo, both team images and the fonts load; `https://zastras.uk/favicon.ico` and `https://zastras.uk/assets/img/og-image.png` return 200. *Partly checked: the verifier fetched the stylesheet, script, font, the team images, `favicon.ico` and `og-image.png` and all returned 200. The browser Network-tab pass is still to do.*
- [ ] **Metadata:** view source on each page: titles, descriptions, canonical URLs (`https://zastras.uk/`, `https://zastras.uk/privacy/` and `https://zastras.uk/retainer/`) and Open Graph tags are correct. Paste the URL into the LinkedIn Post Inspector or a messaging app to confirm the share card shows the Open Graph image.
- [ ] **`robots.txt` and `sitemap.xml`:** `https://zastras.uk/robots.txt` and `https://zastras.uk/sitemap.xml` load and list the five public pages on `zastras.uk`. *Both loaded on 24 November 2026 (three pages listed then); `node scripts/verify-live.mjs` checks every sitemap URL after each deployment.*
- [ ] **Contact form, on the live domain:** send one clearly labelled test enquiry. Confirm it appears in the Formspree dashboard **and** arrives in the notification inbox. Then, in Formspree, set **Restrict to Domain** to `zastras.uk` (no `www`) and send a second labelled test to confirm it still arrives and is not in the spam tab.
- [ ] **Privacy notice** reads correctly on the live site and its legal footer matches Companies House.
- [ ] **Costs and retainer terms:** the prices in the home page costs section match the approved figures, and the "retainer terms" link there opens `https://zastras.uk/retainer/`.
- [ ] **Email:** repeat the inbound and outbound test emails from Section D.
- [x] **Cookies and third parties:** developer tools show no cookies and requests only to `zastras.uk` (plus `formspree.io` when the form is submitted). *Checked on 24 November 2026 with a scripted Chrome session on the live home, privacy and retainer pages (mobile and desktop): five or six requests each, all to `zastras.uk`, no cookies, no console errors. The Formspree submission itself is part of the test above.*

## G. Allow search indexing (last step)

Until the publication pull request, every page carried `<meta name="robots" content="noindex, nofollow">`, so the site could be verified live without being indexed.

- [x] The publication pull request **deletes the three `PREVIEW-NOINDEX` blocks** (the comment and the `noindex` meta tag) in `site/index.html`, `site/privacy/index.html` and `site/retainer/index.html`, and removes the draft banner from the privacy notice. `site/404.html` keeps its `noindex` on purpose: it is served, with an HTTP 404, only for addresses that do not exist.
- [x] `node scripts/check-site.mjs` passes with no failures. It now fails if any public page gains `noindex`, `none`, `nofollow` or `nosnippet`, a draft banner or a placeholder, and the Pages workflow runs it, and `node --test scripts/check-site.test.mjs`, on every pull request.
- [ ] After the merge and deployment: `node scripts/verify-live.mjs` passes (the workflow's *Verify the live site* job runs it; it checks status codes, `X-Robots-Tag` headers, robots meta tags, canonical URLs, redirects and the 404 for every URL in the live sitemap), and `node scripts/verify-cutover.mjs --after --indexable` reports no problems.
- [ ] `curl -sI https://zastras.uk/ | grep -i x-robots` prints nothing, and `curl -s https://zastras.uk/ | grep -ci noindex` prints `0`, and the same for `/privacy/`, `/retainer/`, `/process-review/` and `/one-workflow-pilot/`.
- [ ] Owner: add `https://zastras.uk/` to Google Search Console (a DNS verification record is preferable to a file or tag in `site/`) and submit `https://zastras.uk/sitemap.xml`. This repository does not do it.

## Rollback

If something is wrong and cannot be fixed quickly:

1. In Squarespace DNS, delete the four GitHub A records, the four AAAA records and the `www` CNAME to `zastras.github.io.`.
2. Re-create the records exactly as inventoried in Section B (apex A to Squarespace, `www` CNAME to `ext-sq.squarespace.com.`).
3. Leave MX, SPF, DKIM and the GitHub verification TXT record alone: they were never changed.
4. Optionally remove the custom domain in the repository's Pages settings.

The new records already have a 300 second TTL, so deleting them takes effect within about five minutes for resolvers that have cached them. Records restored in step 2 come back at the 4 hour TTL, so visitors may see the old answer for up to 4 hours.

## After launch: related tidy-ups (separate from the cutover)

- **DMARC.** No `_dmarc` record exists, so receiving mail servers have no policy for spoofed mail from `zastras.uk`. Consider adding one, starting in monitoring mode, as its own change after the cutover has settled. It is deliberately not part of this checklist, so that a mail change cannot be mistaken for a website problem.
- **Companies House.** The registered nature of business (SIC code) for ZASTRAS LTD is shown as `64999 Financial intermediation not elsewhere classified`, which does not describe an AI consultancy. This does not affect the site, but it is worth updating with Companies House when convenient.
- **Squarespace.** Keep the domain registration where it is. Cancel any Squarespace *website* plan only once the new site has been stable for a few days.
