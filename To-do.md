# To-do

Action items for the Zastras Practical AI website. Updated 23 November 2026. The site is not live: `zastras.uk` still serves the Squarespace holding page until the cutover in [docs/CUTOVER.md](docs/CUTOVER.md) is approved and carried out.

## Team page

- [ ] the applied AI specialist's name and photo, only if they agree

## Privacy notice (draft: amber review boxes on the page mark each open item)

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

- [ ] At cutover, turn "Restrict to Domain" back on for `zastras.uk` (no `www`), then send one labelled test from the live domain. Do not turn it on earlier: it files preview submissions as spam.
- [ ] If reCAPTCHA is ever switched back on, repeat the cookie audit and add the provider to the notice.

## Launch

The cutover was approved on 23 November 2026, with the DNS switch **held until the privacy items above are resolved**. You make the DNS and GitHub settings edits; Claude supplies the values and verifies from outside with `node scripts/verify-cutover.mjs`.

Safe to do now (additive; nothing changes for visitors or email):

- [ ] In the DNS panel, lower the TTL of the apex A record and the `www` CNAME to 300 seconds (they are 14400 today), at least 4 hours before the switch.
- [ ] In GitHub, as an organisation owner: *zastras organisation, Settings, Pages, Add a domain*, enter `zastras.uk`, and add the TXT record GitHub shows (named `_github-pages-challenge-zastras`) in the DNS panel, then click Verify. Do **not** set the custom domain on the repository yet: that would make the preview URL redirect to the still-Squarespace domain.

- [ ] Approve the design, copy and team presentation on the preview.
- [ ] Re-check the Companies House record on the day.
- [ ] Work through [docs/CUTOVER.md](docs/CUTOVER.md): DNS inventory, GitHub domain verification, switch the web records, HTTPS, post-switch checks, then remove `noindex`.

## Optional, later

- [ ] After launch, add a thank-you page on the site and a `_next` redirect so visitors without JavaScript stay on the site instead of landing on Formspree's page (which sets a cookie and loads Google Fonts).
- [ ] Add a DMARC record for `zastras.uk` as its own change after the cutover has settled.
- [ ] Ask Companies House to update the SIC code (currently 64999, financial intermediation).
- [ ] Vector versions of the wordmark lockups if print or signage is needed.

## Decided

- **Public address:** the registered office is shown in the footer's legal line, as a company detail only. Nothing on the site invites visits or advertises it as a place to call in, and none is planned.
- Lex's photograph is on his profile card.
- Contact form tested end to end; reCAPTCHA and the domain restriction are off for now.
