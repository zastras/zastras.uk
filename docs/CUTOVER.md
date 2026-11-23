# Production cutover checklist: zastras.uk

**Do not start this until the owner has approved the design, copy, team presentation and privacy notice, and has said "go".** Until then `zastras.uk` keeps serving the Squarespace holding page and no DNS record is touched.

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
- **Email runs on Google.** The MX, SPF and DKIM records below carry it. They are not part of this change and must come out of it exactly as they went in.
- **DNS changes can take up to 24 hours to propagate**, according to GitHub's documentation. Pick a time when a short interruption to the web page is acceptable. Email is unaffected because no mail record changes.
- **No `CNAME` file is needed.** The site publishes through a GitHub Actions workflow, and GitHub ignores any `CNAME` file in that case.
- Nothing here needs a secret to be committed to the repository.

---

## A. Approvals and readiness (no DNS involved)

- [ ] **Design** approved by the owner on the preview, at desktop and mobile widths.
- [ ] **Copy** approved, including the three additions made during the build that were not in the brief (see [REVIEW.md](REVIEW.md), "Decisions made on your behalf").
- [ ] **Team presentation** approved: Lex's photograph supplied and added; the applied AI specialist's page treatment confirmed (name and photograph added only if that person has agreed).
- [ ] **Privacy notice** approved: every amber *owner decision* box resolved and deleted, the draft banner removed, placeholders in square brackets replaced (retention period, notification email service, last-updated date), and a data-protection adviser has read the final text.
- [ ] **Formspree** confirmed by the owner: the notification inbox, who has access, retention, data-processing terms, and the **reCAPTCHA decision** (on: visitors are sent through Formspree's CAPTCHA page; off: they stay on the site, protected by the honeypot and Restrict to Domain). See README, "Settings that live in the Formspree dashboard". A real test submission has been made from the preview and confirmed in both the Formspree dashboard and the notification inbox.
- [ ] **Companies House** record re-checked on the day: <https://find-and-update.company-information.service.gov.uk/company/SC832156>. Name, number and registered office must match the legal footer exactly. (They matched on 23 November 2026.)
- [ ] **Public contact address:** decided whether to show one. If so it is added to the page and to the privacy notice.
- [ ] **Launch pull request merged** to `main` containing the resolutions above. Then run:

  ```bash
  node scripts/check-site.mjs --production
  ```

  At this stage the only failures expected are the two `noindex` lines (Section G removes them after the site has been verified live). Anything else it reports must be fixed first.
- [ ] The latest run of the *Check and deploy site* workflow on `main` is green and the preview at `https://zastras.github.io/zastras.uk/` shows the approved content.

## B. Inventory the existing DNS (before changing anything)

Take a record of everything, so you can restore it exactly.

- [ ] Open *Squarespace, Domains, zastras.uk, DNS settings* and **screenshot or export every record**. Save it somewhere durable (not only in your head).
- [ ] Run these from a terminal and keep the output with the screenshot:

  ```bash
  for t in A AAAA CNAME MX TXT NS CAA; do echo "== zastras.uk $t"; dig +noall +answer zastras.uk $t; done
  for h in www _dmarc google._domainkey _domainconnect; do echo "== $h.zastras.uk"; dig +noall +answer $h.zastras.uk ANY; dig +noall +answer $h.zastras.uk TXT; dig +noall +answer $h.zastras.uk CNAME; done
  ```

- [ ] Note the **TTL** of each record. (They were not captured on 23 November 2026; read them from the DNS panel.)
- [ ] Optional but sensible: **lower the TTLs** on the apex A and `www` records to 300 seconds 24 to 48 hours beforehand, so a rollback takes effect quickly.

**What was observed on 23 November 2026** (by `dig`; confirm against the DNS panel, which is the source of truth):

| Name | Type | Value observed | Action at cutover |
|---|---|---|---|
| `zastras.uk` | A | `198.185.159.145` (Squarespace) | **Replace** with the four GitHub addresses in Section D |
| `zastras.uk` | AAAA | none | **Add** the four GitHub IPv6 addresses (optional, recommended by GitHub) |
| `www.zastras.uk` | CNAME | `ext-sq.squarespace.com.` | **Replace** with `zastras.github.io.` |
| `zastras.uk` | MX | `1 smtp.google.com.` | **Keep unchanged** |
| `zastras.uk` | TXT (SPF) | `"v=spf1 include:_spf.google.com ~all"` | **Keep unchanged** |
| `google._domainkey.zastras.uk` | TXT (DKIM) | `"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz61yeLjz3ePAC…"` (full key in the panel) | **Keep unchanged** |
| `_dmarc.zastras.uk` | TXT | none found | Nothing to preserve (see "DMARC" below) |
| `_domainconnect.zastras.uk` | CNAME | `_domainconnect.domains.squarespace.com.` | Leave as is (Squarespace's one-click DNS helper; harmless) |
| `zastras.uk` | NS | `ns-cloud-e1` to `e4.googledomains.com.` | **Do not change** |
| `zastras.uk` | CAA | none found | Nothing to preserve |

Any record in the panel that is not in this table must also be kept unless you can say what it is for and that it is no longer needed.

## C. Verify the domain in GitHub and configure the Pages custom domain

Verifying first stops anyone else from claiming the domain for their own Pages site. Do this in one sitting with Section D.

- [ ] **Verify the domain** for the `zastras` organisation: *github.com, zastras organisation, Settings, Pages, Add a domain*, enter `zastras.uk`. GitHub shows a TXT record to add, of the form `_github-pages-challenge-zastras.zastras.uk` with a value GitHub gives you. Add exactly that TXT record in Squarespace DNS (this is additive and does not affect the website or email), wait for it to resolve, then click *Verify*. Keep the TXT record afterwards: GitHub re-checks it periodically.
- [ ] In the repository, *Settings, Pages, Custom domain*: enter **`zastras.uk`** (the apex) and save. Using the apex as the custom domain means GitHub redirects `www.zastras.uk` to `zastras.uk` once both DNS records exist.
- [ ] Expect a "DNS check unsuccessful" message at this point. That is normal until Section D is done.

## D. Switch the web records

In Squarespace DNS:

- [ ] **Remove** the Squarespace A record(s) for the apex (`@`) and the `www` CNAME to `ext-sq.squarespace.com.`. Leave every other record alone.
- [ ] **Add four A records** for `@`:

  | Type | Host | Value |
  |---|---|---|
  | A | `@` | `185.199.108.153` |
  | A | `@` | `185.199.109.153` |
  | A | `@` | `185.199.110.153` |
  | A | `@` | `185.199.111.153` |

- [ ] **Add four AAAA records** for `@` (recommended by GitHub):

  | Type | Host | Value |
  |---|---|---|
  | AAAA | `@` | `2606:50c0:8000::153` |
  | AAAA | `@` | `2606:50c0:8001::153` |
  | AAAA | `@` | `2606:50c0:8002::153` |
  | AAAA | `@` | `2606:50c0:8003::153` |

- [ ] **Add one CNAME** for `www`:

  | Type | Host | Value |
  |---|---|---|
  | CNAME | `www` | `zastras.github.io.` |

  The target is the organisation's Pages domain **without the repository name**, and not the `*.pages.github.io` address shown in the settings. Never point `www` at the apex.
- [ ] Do **not** add wildcard (`*`) records. GitHub advises against them because they invite domain takeover.
- [ ] Confirm the records resolve (allow time to propagate):

  ```bash
  dig +noall +answer zastras.uk A        # four 185.199.10x.153 addresses
  dig +noall +answer zastras.uk AAAA     # four 2606:50c0:800x::153 addresses
  dig +noall +answer www.zastras.uk      # zastras.github.io. then GitHub addresses
  ```

- [ ] **Email still intact:** re-run the MX, SPF and DKIM lookups from Section B. They must match the "before" output exactly. Send a test email to the domain from outside, and one from it, and confirm both arrive.

## E. Enable and check HTTPS

- [ ] In *Settings, Pages*, wait for the green **DNS check successful** message. GitHub then provisions a certificate; this can take from minutes up to about a day.
- [ ] Tick **Enforce HTTPS** as soon as it becomes available.
- [ ] Check the certificate: open `https://zastras.uk` and confirm the padlock, the certificate covers `zastras.uk`, and there are no mixed-content warnings (the page requests nothing from other hosts, so there should be none).
- [ ] `http://zastras.uk` and `http://www.zastras.uk` both redirect to `https://zastras.uk`.

## F. Check everything after the switch

Use a private window or `curl`, so you see what a new visitor sees.

- [ ] **Apex:** `https://zastras.uk` loads the new site, not the Squarespace page.
- [ ] **www redirect:** `curl -sI https://www.zastras.uk | head` shows a `301` to `https://zastras.uk/`.
- [ ] **Internal links:** every item in the header and footer navigation scrolls to the right section; the privacy link works from the home page and the privacy page links back; the "Discuss a workflow" and "How we work" buttons work. Run `node scripts/check-site.mjs --external` for a mechanical pass.
- [ ] **Images and fonts:** nothing 404s (browser developer tools, Network tab); the logo, both team images and the fonts load; `https://zastras.uk/favicon.ico` and `https://zastras.uk/assets/img/og-image.png` return 200.
- [ ] **Metadata:** view source on both pages: titles, descriptions, canonical URLs (`https://zastras.uk/` and `https://zastras.uk/privacy/`) and Open Graph tags are correct. Paste the URL into the LinkedIn Post Inspector or a messaging app to confirm the share card shows the Open Graph image.
- [ ] **`robots.txt` and `sitemap.xml`:** `https://zastras.uk/robots.txt` and `https://zastras.uk/sitemap.xml` load and list the two pages on `zastras.uk`.
- [ ] **Contact form, on the live domain:** send one clearly labelled test enquiry. Confirm it appears in the Formspree dashboard **and** arrives in the notification inbox. Then, in Formspree, set **Restrict to Domain** to `zastras.uk` (no `www`) and send a second labelled test to confirm it still arrives and is not in the spam tab.
- [ ] **Privacy notice** reads correctly on the live site and its legal footer matches Companies House.
- [ ] **Email:** repeat the inbound and outbound test emails from Section D.
- [ ] **Cookies and third parties:** developer tools show no cookies and requests only to `zastras.uk` (plus `formspree.io` when the form is submitted).

## G. Allow search indexing (last step)

Until now every page carries `<meta name="robots" content="noindex, nofollow">`, so the site has been verified live without being indexed.

- [ ] Open a pull request that **deletes the two `PREVIEW-NOINDEX` blocks** (the comment and the `noindex` meta tag) in `site/index.html` and `site/privacy/index.html`.
- [ ] `node scripts/check-site.mjs --production` now passes with no failures (and no placeholder warning).
- [ ] Merge; wait for the deploy; confirm `curl -s https://zastras.uk | grep -ci noindex` prints `0`, and the same for `/privacy/`.
- [ ] Optional: add `https://zastras.uk` to Google Search Console and submit `https://zastras.uk/sitemap.xml`.

## Rollback

If something is wrong and cannot be fixed quickly:

1. In Squarespace DNS, delete the four GitHub A records, the four AAAA records and the `www` CNAME to `zastras.github.io.`.
2. Re-create the records exactly as inventoried in Section B (apex A to Squarespace, `www` CNAME to `ext-sq.squarespace.com.`).
3. Leave MX, SPF, DKIM and the GitHub verification TXT record alone: they were never changed.
4. Optionally remove the custom domain in the repository's Pages settings.

Lowering TTLs beforehand (Section B) makes this take effect in minutes rather than hours.

## After launch: related tidy-ups (separate from the cutover)

- **DMARC.** No `_dmarc` record exists, so receiving mail servers have no policy for spoofed mail from `zastras.uk`. Consider adding one, starting in monitoring mode, as its own change after the cutover has settled. It is deliberately not part of this checklist, so that a mail change cannot be mistaken for a website problem.
- **Companies House.** The registered nature of business (SIC code) for ZASTRAS LTD is shown as `64999 Financial intermediation not elsewhere classified`, which does not describe an AI consultancy. This does not affect the site, but it is worth updating with Companies House when convenient.
- **Squarespace.** Keep the domain registration where it is. Cancel any Squarespace *website* plan only once the new site has been stable for a few days.
