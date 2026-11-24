# To-do

Action items for the Zastras Practical AI website. Updated 24 November 2026. The site is live at `https://zastras.uk/` (DNS switched, HTTPS enforced), but search engines are told not to index it (`noindex`) until the privacy items below are closed. Where the cutover stands: [docs/CUTOVER.md](docs/CUTOVER.md), "Status on 24 November 2026".

## Team page

- [ ] the applied AI specialist's name and photo, only if they agree

## Costs and retainer terms (retainer terms approved 24 November 2026)

The home page has a costs section with the three prices (process review £500–£750, one-workflow pilot £2,000–£5,000, ongoing care retainer £400–£900 a month), and `site/retainer/index.html` holds the retainer terms.

- [x] **Retainer terms approved by the owner on 24 November 2026**, as drafted: notice and term, response times, payment and fee changes, the liability cap, third-party tool fees, ownership, handover, Scots law, and fees quoted excluding VAT. The draft banner and owner-review box are removed and the page is dated 24 November 2026.
- [ ] **Confirm the wording added around the prices** in the costs section: "Each stage is a separate decision", "A written fee before any work starts" and "What sets the price" under each card. The section does not say whether the first conversation is free. Add a line if it is.
- [ ] **Decide where one-off staff training sits.** The terms say training for new groups of staff is quoted separately. Still open: service 03 on the home page is "Training and ongoing care", but only the retainer is priced, so say whether the initial training is part of the pilot, part of the retainer, or quoted separately, and update both pages.
- [ ] **Set the monthly change allowance** that goes with each price point (for example, hours of changes a month at £400, £650 and £900). The terms leave it to the order form because no figure exists yet.
- [ ] **Draft the order form and a data processing agreement.** The published terms rely on both, so until they exist there is nothing to sign. Under UK GDPR, handling personal data for a client needs a written contract with the client.
- [ ] **Have a solicitor read the retainer terms**, the liability, data protection and Scots-law parts most of all. These records show no legal review so far. Check the liability cap against any professional indemnity or cyber insurance the company holds; the page claims none.

## Privacy notice (live, but still marked draft; the review boxes are gone)

The lawful basis is decided: legitimate interests, Article 6(1)(f) UK GDPR. On 23 November 2026 the owner answered the open facts: access is the Director only, enquiries are kept for 12 months, Formspree's listing includes the UK Extension, and the company is on the ICO register. The first three are now written into the notice. The ICO registration is deliberately not claimed on the site. What is left:

- [ ] **Re-check Formspree's Data Privacy Framework entry on launch day** (a one-minute look, alongside the Companies House check). The owner confirmed on 23 November 2026 that it reads Active with the UK Extension. Certifications renew every year, so confirm it still reads Active and covers non-HR data, and note the date in the internal record. If it lapses, the transfer paragraph has to change.
- [ ] **Run the 12-month deletion routine** so the retention paragraph stays true. Put it in the diary before launch: on the 1st of each month delete every submission in the Formspree dashboard (Inbox and Spam) that has reached the mailbox; each quarter delete enquiry emails older than 12 months from the mailbox, unless held for a legal claim. Before launch, check whether the Formspree account already holds submissions older than 30 days, which the Free plan hides. Steps are in the internal compliance record.
- [ ] **Two-factor authentication** on the Formspree account and the receiving mailbox, and no forwarding rules or delegates on the mailbox.
- [ ] **Formspree as processor (loose end, not a blocker).** Ask Formspree to confirm it acts as our processor and whether it offers a data processing agreement. Its privacy policy describes API users as independent controllers, while its security page says it acts as a processor. The message is in the internal compliance record; the transfer question in it is now answered, so send only the other points.
- [ ] Sign the legitimate interests assessment (internal record).
- [x] Website hosting section and cookie wording approved by the owner on 24 November 2026; the review boxes are removed from the page. The notice names no transfer safeguard for GitHub's US processing of visitor IP logs (see the internal record).
- [ ] On publication (with the `noindex` removal): set "Last updated" and delete the draft banner, then run `node scripts/check-site.mjs --production`.
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

Still to do, in this order (details in [docs/CUTOVER.md](docs/CUTOVER.md), sections D to G):

- [ ] Formspree: labelled test from the live domain, then Restrict to Domain (see "Formspree settings" above).
- [ ] Send a real test email to the domain from outside, and one from it, and confirm both arrive. Mail records are unchanged, but the test has not been done.
- [ ] Re-check the Companies House record on the day: <https://find-and-update.company-information.service.gov.uk/company/SC832156>.
- [ ] Re-audit cookies and third-party requests on the live domain (the earlier audit ran against the preview).
- [ ] Close the privacy items above, then publish: set "Last updated", delete the draft banner, remove the three `PREVIEW-NOINDEX` blocks (home, privacy and retainer pages), run `node scripts/check-site.mjs --production` and `node scripts/verify-cutover.mjs --after --indexable`.
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
