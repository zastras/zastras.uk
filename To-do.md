# To-do

Action items for the Zastras Practical AI website. Updated 23 November 2026. The site is not live: `zastras.uk` still serves the Squarespace holding page until the cutover in [docs/CUTOVER.md](docs/CUTOVER.md) is approved and carried out.

## Team page

- [ ] the applied AI specialist's name and photo, only if they agree

## Privacy notice (draft: amber review boxes on the page mark each open item)

The lawful basis is decided: legitimate interests, Article 6(1)(f) UK GDPR. The internal assessment is written and waiting for Lex's sign-off. Two statements are held back until their facts are true.

- [ ] **Retention (held back).** Adopt a routine that makes "12 months after the last exchange" true in both places, then publish the paragraph. Formspree stores every submission until it is deleted, and on the Free plan it only shows the last 30 days, so either purge the Formspree dashboard monthly (with the mailbox as the record) or move to a paid plan with full history. Add a quarterly mailbox clean-up and a calendar reminder. Steps are in the internal compliance record.
- [ ] **UK transfer safeguard (held back).** Ask Formspree for its signed data processing terms including the UK Addendum or IDTA, whether it is active on the Data Privacy Framework with the UK Extension, and confirmation that it acts as a processor. A ready-to-send message is in the internal compliance record. Then name the verified safeguard in the notice.
- [ ] **Access.** Confirm who can log in to the Formspree account and who can read the receiving mailbox, and that it matches "only Lex Sobrinho and specifically authorised team members". Check two-factor authentication on both.
- [ ] **ICO data protection fee.** Search the ICO register for "ZASTRAS LTD" and take the fee self-assessment for everything the company does. Record the result and any reference. Do not say "ICO registered" anywhere on the site until the register shows it.
- [ ] Sign the legitimate interests assessment (internal record).
- [ ] On publication: set "Last updated", delete the review boxes and the draft banner, then run `node scripts/check-site.mjs --production`.

## Formspree settings

- [ ] At cutover, turn "Restrict to Domain" back on for `zastras.uk` (no `www`), then send one labelled test from the live domain. Do not turn it on earlier: it files preview submissions as spam.
- [ ] Check there are no submissions older than 30 days already in the account that would be invisible on the Free plan.
- [ ] If reCAPTCHA is ever switched back on, repeat the cookie audit and add the provider to the notice.

## Launch

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
