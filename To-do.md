# To-do

Action items for the Zastras Accelerate website. Updated 24 November 2026. The site is live at `https://zastras.uk/` (DNS switched, HTTPS enforced) and, with the pull request that carries this change, open to search engines: the three `noindex` tags are gone and the 404 page is the only page that keeps one. Where the cutover stands: [docs/CUTOVER.md](docs/CUTOVER.md), "Status on 24 November 2026".

## Search and indexing (new, 24 November 2026)

Done in the repository: indexing tags removed, one URL scheme, sitemap of five pages, page-specific titles and descriptions, `Organization`/`WebSite` structured data, two service pages, strict checks in CI and a post-deployment check of the live site. See the README, "Search engines".

- [ ] **Search Console (owner and the person who commissioned the SEO work, not done by Claude):** add the property for `https://zastras.uk/` (a DNS verification record is preferable to a file or tag in `site/`), then submit `https://zastras.uk/sitemap.xml`. Google Ads and Business Profile are separate and not started.
- [ ] **Decide whether the site should state where it works.** On 24 November 2026 the owner removed "Edinburgh and the Lothians" and "smaller firms" from every page, so the site names no place. The registered office in the footer is Glasgow, which is a company detail, not a customer-facing office. If a service area is wanted for local search, say what it is (for example Scotland, or Edinburgh and the Lothians), then put it in the visible copy first and only afterwards in the title, description and JSON-LD `areaServed`. Do not claim an office or in-person presence that does not exist.
- [ ] **Read the two new service pages** (`site/process-review/`, `site/one-workflow-pilot/`) as the owner would read a client's contract: they were written only from statements already on the site, but they are new text and go live with the merge. The statements to look at: the pilot "usually follows" a process review; the recommendation "may be that AI is not worth using"; the process review's fourth step ("make a recommendation"); and the illustration of the leaking-tap workflow, which is the hero illustration repeated.
- [ ] **Staff training page: held back.** It cannot be written until the question under "Costs and retainer terms" below is answered (where one-off training sits and what it costs). Add it, with a sitemap line and links, when it is.
- [ ] **No sector pages:** each sector on the home page has one sentence of material, which is not enough for a page that is not near-identical to the others. Revisit only if there is real, distinct experience to write about.
- [ ] **Run Google's Rich Results Test** on `https://zastras.uk/`, `/process-review/` and `/one-workflow-pilot/` once deployed. The browser available to Claude refused it, so the JSON-LD has so far been validated only by the repository's own parser and rules.
- [ ] **Field data:** Core Web Vitals from real visitors exist only after enough traffic (Search Console, Core Web Vitals report). The measurements so far are lab runs; see `docs/REVIEW.md`.
- [ ] If sitemap `<lastmod>` dates are wanted, decide who updates them and when (they must change only when a page's content meaningfully changes). None are published today.

## Team page

- [x] The second team card now shows its photograph, name, role line and biography, supplied by the owner on 24 November 2026.

## Costs and retainer terms (retainer terms approved 24 November 2026)

The home page has a costs section with the three prices (process review £500–£750, one-workflow pilot £2,000–£5,000, ongoing care retainer £400–£900 a month), and `site/retainer/index.html` holds the retainer terms.

- [x] **Retainer terms approved by the owner on 24 November 2026**, as drafted: notice and term, response times, payment and fee changes, the liability cap, third-party tool fees, ownership, handover, Scots law, and fees quoted excluding VAT. The draft banner and owner-review box are removed and the page is dated 24 November 2026.
- [ ] **Confirm the wording added around the prices** in the costs section: "Each stage is a separate decision", "A written fee before any work starts" and "What sets the price" under each card. The section does not say whether the first conversation is free. Add a line if it is.
- [ ] **Decide where one-off staff training sits.** The terms say training for new groups of staff is quoted separately. Still open: service 03 on the home page is "Training and ongoing care", but only the retainer is priced, so say whether the initial training is part of the pilot, part of the retainer, or quoted separately, and update both pages.
- [ ] **Set the monthly change allowance** that goes with each price point (for example, hours of changes a month at £400, £650 and £900). The terms leave it to the order form because no figure exists yet.
- [ ] **Draft the order form and a data processing agreement.** The published terms rely on both, so until they exist there is nothing to sign. Under UK GDPR, handling personal data for a client needs a written contract with the client.
- [ ] **Have a solicitor read the retainer terms**, the liability, data protection and Scots-law parts most of all. These records show no legal review so far. Check the liability cap against any professional indemnity or cyber insurance the company holds; the page claims none.

## Privacy notice (published 24 November 2026; draft banner removed)

The lawful basis is decided: legitimate interests, Article 6(1)(f) UK GDPR. On 23 November 2026 the owner answered the open facts: access is the Director only, enquiries are kept for 12 months, Formspree's listing includes the UK Extension, and the company is on the ICO register. The first three are written into the notice. The ICO registration is deliberately not claimed on the site. The notice goes live and indexable with the change that removes the draft banner. **These items were listed as conditions of publication and were still open when this change was prepared; each is something only the owner can do or confirm**, and the notice's statements about retention, access and the transfer safeguard are only true while they are done:

- [ ] **Re-check Formspree's Data Privacy Framework entry on launch day** (a one-minute look, alongside the Companies House check). The owner confirmed on 23 November 2026 that it reads Active with the UK Extension. Certifications renew every year, so confirm it still reads Active and covers non-HR data, and note the date in the internal record. If it lapses, the transfer paragraph has to change.
- [ ] **Run the 12-month deletion routine** so the retention paragraph stays true. Put it in the diary before launch: on the 1st of each month delete every submission in the Formspree dashboard (Inbox and Spam) that has reached the mailbox; each quarter delete enquiry emails older than 12 months from the mailbox, unless held for a legal claim. Before launch, check whether the Formspree account already holds submissions older than 30 days, which the Free plan hides. Steps are in the internal compliance record.
- [ ] **Two-factor authentication** on the Formspree account and the receiving mailbox, and no forwarding rules or delegates on the mailbox.
- [ ] **Formspree as processor (loose end, not a blocker).** Ask Formspree to confirm it acts as our processor and whether it offers a data processing agreement. Its privacy policy describes API users as independent controllers, while its security page says it acts as a processor. The message is in the internal compliance record; the transfer question in it is now answered, so send only the other points.
- [ ] Sign the legitimate interests assessment (internal record).
- [x] Website hosting section and cookie wording approved by the owner on 24 November 2026; the review boxes are removed from the page. The notice names no transfer safeguard for GitHub's US processing of visitor IP logs (see the internal record).
- [x] On publication (with the `noindex` removal): "Last updated" set to 24 November 2026 and the draft banner deleted; `node scripts/check-site.mjs` passes (it now fails if either returns). If publication slips to a later day, change the date to the day it goes live. Update it again whenever the notice's meaning changes.
- [x] **Statements checked against the deployed site, 24 November 2026:** the notice says the site loads no scripts, fonts or other resources from third parties and uses no analytics or advertising cookies. A browser pass over the live home, privacy and retainer pages found requests to `zastras.uk` only and no cookies, and the repository check now fails if a third-party resource or a known analytics or font service is added. The claim about Formspree's confirmation page (cookie, Google Fonts) concerns Formspree's own page and has not been re-tested.
- [x] **Companies House re-checked 24 November 2026:** ZASTRAS LTD, SC832156, Active; registered office 48 West George Street, 2nd Floor, Glasgow, G2 1BP, matching the footer exactly.
- [ ] **The notice says it "does not cover work for clients, which is described separately".** Nothing describes it yet: the order form and the data processing agreement (see "Costs and retainer terms") do not exist, and the two service pages deliberately say nothing about client-data terms beyond "agreed before anything is built".
- [x] **UK transfer safeguard:** Formspree's Data Privacy Framework entry reads Active and includes the UK Extension (owner, 23 November 2026). Written into the notice.
- [x] **Access** confirmed on 23 November 2026: the Director only.
- [x] **ICO data protection fee:** the company is on the ICO register (checked on the register, 23 November 2026; details in the internal record). Diary the renewal. Check that the register entry's address and trading names are current.

## Formspree settings

- [ ] **Now due, as the domain is live:** send one labelled test enquiry from `https://zastras.uk/`, check it reaches the Formspree dashboard and the notification inbox, then turn "Restrict to Domain" on for `zastras.uk` (no `www`) and send a second labelled test to confirm it still arrives and is not filed as spam.
- [ ] If reCAPTCHA is ever switched back on, repeat the cookie audit and add the provider to the notice.

## Launch

The cutover was approved on 23 November 2026. Lex made the DNS changes in Squarespace that evening; on 24 November the Pages custom domain and Enforce HTTPS were switched on at his explicit yes. Claude verifies from outside with `node scripts/verify-cutover.mjs --after` (last run 24 November 2026: no problems).

Done:

- [x] DNS: four A and four AAAA records at the apex and a `www` CNAME to `zastras.github.io.`, all at a 300 second TTL; the Squarespace default records removed; MX, SPF, DKIM and the name servers unchanged.
- [x] Domain verified in the GitHub organisation, `zastras.uk` set as the Pages custom domain, certificate approved (expires 22 February 2027, renewed automatically), Enforce HTTPS on, `http` and `www` redirect to `https://zastras.uk/`.
- [x] Design, copy and team presentation approved (with the cutover approval of 23 November 2026).

Still to do (details in [docs/CUTOVER.md](docs/CUTOVER.md), sections D to G). The Formspree and email tests were meant to come before indexing; they and the privacy items above are the owner's:

- [ ] Formspree: labelled test from the live domain, then Restrict to Domain (see "Formspree settings" above).
- [ ] Send a real test email to the domain from outside, and one from it, and confirm both arrive. Mail records are unchanged, but the test has not been done.
- [ ] Re-check the Companies House record on the day: <https://find-and-update.company-information.service.gov.uk/company/SC832156>.
- [x] Re-audit cookies and third-party requests on the live domain: done 24 November 2026 for page loads (requests to `zastras.uk` only, no cookies). The form submission to Formspree is the part still untested; it belongs to the Formspree test above.
- [x] Publish: "Last updated" set, draft banner deleted, the three `PREVIEW-NOINDEX` blocks removed, `node scripts/check-site.mjs` passing. After the merge, `node scripts/verify-live.mjs` and `node scripts/verify-cutover.mjs --after --indexable` are the checks on what is served (the Pages workflow runs the first automatically).
- [ ] Turn on two-factor authentication on the Squarespace account that controls the domain (not set up as of 24 November 2026).

## Optional, later

- [ ] After launch, add a thank-you page on the site and a `_next` redirect so visitors without JavaScript stay on the site instead of landing on Formspree's page (which sets a cookie and loads Google Fonts).
- [ ] Add a DMARC record for `zastras.uk` as its own change after the cutover has settled.
- [ ] Ask Companies House to update the SIC code (currently 64999, financial intermediation).
- [ ] Vector versions of the wordmark lockups if print or signage is needed.

## Decided

- **Public address:** the registered office is shown in the footer's legal line, as a company detail only. Nothing on the site invites visits or advertises it as a place to call in, and none is planned.
- Lex's photograph is on his profile card.
- Contact form tested end to end; reCAPTCHA and the domain restriction are off for now.
