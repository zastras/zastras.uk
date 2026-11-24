# Review notes

For the owner's review of the first version of the site. Written 23 November 2026, updated 24 November 2026. The site has since gone live at `zastras.uk` (DNS switched on 23 November 2026, HTTPS enforced on 24 November 2026); it is still marked `noindex`. See [CUTOVER.md](CUTOVER.md), "Status on 24 November 2026". The checks below were run against the preview before the switch.

## What to look at

| What | Where |
|---|---|
| Live site (marked `noindex`) | https://zastras.uk/ and https://zastras.uk/privacy/ (the old `zastras.github.io` preview address redirects to these) |
| Desktop, full page | [previews/desktop-home.jpg](previews/desktop-home.jpg), [previews/desktop-privacy.jpg](previews/desktop-privacy.jpg) |
| Mobile, key screens and the open menu | [previews/mobile-overview.jpg](previews/mobile-overview.jpg) |
| The reasoning behind the visual identity | [BRAND.md](BRAND.md) |
| How to launch | [CUTOVER.md](CUTOVER.md) |

## Contact form: status

**Confirmed end to end by the owner on 23 November 2026.** A clearly labelled test enquiry sent from the live preview page ("TEST SUBMISSION 3 - please ignore", sender `test-submission@example.com`) was accepted by Formspree (HTTP 200, `ok: true`), showed the success message on the page, appeared in the Formspree dashboard's main list, and reached the notification inbox.

How it got there, for the record:

- **Test 1** was refused by Formspree with `403: In order to submit via AJAX, you need to set a custom key or reCAPTCHA must be disabled` while reCAPTCHA was on. Nothing was delivered and the page kept the visitor's text. That is why the page now **falls back to a normal form post** when it sees that response: if reCAPTCHA is ever switched back on, enquiries still arrive, via Formspree's CAPTCHA page. The owner then switched reCAPTCHA off.
- **The next test** was accepted but filed in Formspree's spam folder, because the form was restricted to `zastras.uk` while the preview is served from `zastras.github.io`. The owner switched the domain restriction off. Tests 2 and 3 followed; test 3 is the confirmed delivery above.
- **Two honeypot probes** ("probe - ignore") were also sent to check the reCAPTCHA setting. Formspree is meant to discard them; if they appear in the dashboard, ignore them.
- **Restrict to Domain** is currently off. Leave it off until cutover, then set it to `zastras.uk` (no `www`) and send one more labelled test from the live domain (CUTOVER.md, section F).

Settings now in force on the Formspree form: reCAPTCHA off; domain restriction off; spam protection is the hidden honeypot.

## Decisions made on your behalf

None of these were in the brief. Each is easy to reverse; say if you want any changed.

**Hosting and tooling**

- **The repository is public.** GitHub Pages is only available for public repositories on a free organisation plan. The code contains nothing secret (the Formspree endpoint is public by design).
- **Fonts:** Geist and Geist Mono (SIL Open Font License), self-hosted as latin woff2 subsets (29 KB and 23 KB). No Google Fonts or other third-party requests.
- **Commits use GitHub's no-reply address**, so no personal email address is published in the history.
- **Review-branch deploys:** while the pull request was open, the workflow also deployed the `build/initial-site` branch so the preview existed before merging. That trigger, and the branch's entry under *Settings, Environments, github-pages, Deployment branches*, were removed at merge. From now on only `main` publishes.

**Copy and content added beyond the brief** (all framed as things to investigate, none as results)

- A positioning line under the hero, followed by a short paragraph saying we do not sell a catalogue of tools.
- Under each outcome, a "How we would check" line (for example "Minutes per task, before and after, on real examples").
- Under each service, a "You get" line, and one-line explanations for each of the seven approach steps.
- Three short principles under the hero buttons: "One workflow at a time", "A person reviews what matters", "Measured against a baseline".
- The hero illustration: a four-step enquiry-handling example (a tenant reporting a leaking tap), explicitly labelled "Illustration" with a note that every workflow starts from the firm's own process.
- A three-step "what happens next" in the contact section, without any promised response time.
- "No pressure, and no obligation" in the contact copy.
- The second profile's role line, **"Applied AI | Security-minded implementation"**, which is derived from the brief's biography rather than supplied. The brief only gave a title and a placeholder for the name. Change or remove it freely.
- Line icons for the outcomes and sectors.

**Privacy notice** (rewritten on 23 November 2026 from the owner's decisions; review boxes on the page mark what is open)

- Uses the supplied wording, with legitimate interests (Article 6(1)(f) UK GDPR) as the lawful basis.
- **Filled in from the owner's answers on 23 November 2026:** access (the Director only), the 12-month retention paragraph, and the UK transfer safeguard (the UK Extension to the Data Privacy Framework; the owner confirmed on 23 November 2026 that Formspree's entry is Active and includes it, and this build could not read that site itself). The retention sentence stays true only while the monthly and quarterly deletion routine runs. The transfer sentence depends on the listing staying active, so it is re-checked on launch day.
- Approved by the owner on 24 November 2026: the two additions below. The only markers left on the page are the draft banner and the publication date, which are set at publication.
- Added beyond the supplied wording: a short website-hosting section (GitHub logs visitor IP addresses, per GitHub's documentation) and a sentence that the services necessarily receive technical details such as an IP address.
- **ICO:** the company is on the ICO register (checked on the register on 23 November 2026). The notice does not claim it, because the fee is a company obligation and not a statement for visitors; only the complaint route is mentioned. See [To-do.md](../To-do.md).

## Remaining inputs

| Input | Where it goes |
|---|---|
| **Lex's photograph** | **Added** (a 6:5 crop of the supplied headshot, two WebP sizes, 34 KB and 12 KB, no metadata). To swap it later: [README, "Replacing the two team images"](../README.md#replacing-the-two-team-images). The original 1.9 MB PNG stays in the project folder and is git-ignored, not committed. |
| **The applied AI specialist's name and photograph** | Only when that person agrees. Until then the card shows the abstract graphic and the title. Nothing identifying is in the repository, including file names, alt text and commit history. |
| **Notification inbox: who has access** | Delivery is confirmed, and access is the Director only (owner, 23 November 2026). Two-factor authentication on the Formspree account and the mailbox is still to check. |
| **Privacy-notice open items** | See [To-do.md](../To-do.md): re-check Formspree's Data Privacy Framework entry on launch day, put the 12-month deletion routine in the diary, sign the internal assessment. |
| **Companies House re-check** on launch day | The legal footer. It matched the official record on 23 November 2026. |

## Checks performed and results

All run against the final code. "Local" is a static server on the repository's `site/` folder; "sub-path" is the same files served under `/zastras.uk/`, as GitHub Pages does for the preview; "live" is the deployed preview.

| Check | How | Result |
|---|---|---|
| Structure, links, anchors, metadata, form endpoint, labels, legal footer, sitemap, credentials | `node scripts/check-site.mjs` (also runs in CI) | Pass |
| Does the check script actually catch faults? | Injected seven faults into a copy (broken anchor, missing file, missing alt, wrong form endpoint, altered legal text, skipped heading level, root-relative path) | All caught |
| Launch gate | `node scripts/check-site.mjs --production` | Fails, as designed, until noindex, owner-decision boxes, draft banner and placeholders are gone |
| External links | `--external` | 3 of 3 return 200 (Formspree privacy policy, GitHub privacy statement, ICO complaints page) |
| Horizontal overflow | Chrome at 320, 375, 390, 768, 1024, 1440 px, on all three pages | None. The 320 px case approximates 400% zoom on a 1280 px screen |
| Automated accessibility | axe-core with WCAG 2.0, 2.1, 2.2 A and AA rules plus best practice, on home and privacy at 1440 and 390 px, and the 404 page | 0 violations. Colour contrast could not be resolved by axe over gradients, so it was measured separately (next row) |
| Colour contrast on rendered pixels | Hid all text, screenshotted, and measured the worst pixel behind every text element against its colour | 536 text elements across two pages and two widths: 0 below WCAG AA. A deliberate bad colour was caught, so the check does work |
| Text spacing (WCAG 1.4.12) | Applied the minimum spacing overrides | No overflow or clipped text |
| Keyboard | Tabbed through the whole home page | Skip link first; 24 focus stops in a logical order; every stop has a visible indicator; none is hidden under the sticky header |
| Mobile menu | Scripted | Opens, sets `aria-expanded`, Escape closes and returns focus to the button, choosing a link closes it, resizing to desktop restores the inline navigation |
| Without JavaScript | Scripted with JavaScript disabled | Navigation visible, no dead menu button; the form posts to the exact endpoint with name, email, organisation, message, an empty honeypot and the subject |
| Reduced motion | Emulated `prefers-reduced-motion: reduce` | All animation and smooth scrolling off; content visible. Animation is present by default |
| Form states, with the Formspree endpoint mocked | 33 scripted checks | All pass: empty and invalid input, focus to first error, messages clear as fixed, one request only on double-click plus Enter, success only on a 2xx response, 500, 422 field errors, 429, network failure, 20-second timeout, 403 reCAPTCHA fallback; entered text kept on every failure |
| Privacy of the site itself | Scripted | No cookies, no local or session storage, no console errors, no failed requests. Only host contacted is the site's own (plus formspree.io on submit) |
| Sub-path hosting | Re-ran the browser checks under `/zastras.uk/` | 52 of 52 pass, so links and assets work on the preview and will work at the domain root |
| Live preview | Re-ran the browser checks against the deployed preview | All pass except two lines in my script that expected the host `localhost`; the only host contacted was `zastras.github.io`, so those are test artefacts, not defects |
| Live 404 page | Requested a missing URL on the preview | Returns 404 with the branded page and styles |
| Companies House | Fetched the official record on 23 November 2026 | ZASTRAS LTD, SC832156, active, 48 West George Street, 2nd Floor, Glasgow, Scotland, G2 1BP: matches the footer |
| Formspree end to end | Real labelled submission from the live preview, after reCAPTCHA and the domain restriction were switched off | **Accepted (HTTP 200), shown on the page, present in the dashboard and received in the inbox (confirmed by the owner).** Earlier attempts: refused (403) with reCAPTCHA on, then filed as spam by the domain restriction |

## Not verified

Be aware of the limits of the above:

- **No real screen reader** (VoiceOver, NVDA, JAWS) was used. Automated rules, keyboard testing and semantic markup give good confidence, but they are not a substitute.
- **Browsers:** tested in current Chrome only (headless). Safari and Firefox were not tested. Nothing exotic is used, but `backdrop-filter` and `text-wrap` fall back gracefully rather than being tested.
- **Real devices:** mobile was tested by viewport emulation, not on phones or tablets.
- **Email delivery** was confirmed by the owner for one test. It was not checked on the live domain, which does not exist yet; CUTOVER.md section F includes that test.
- **Share previews** (the Open Graph card) cannot be tested until the domain is live, because the metadata points at `https://zastras.uk/assets/img/og-image.png`.
- **HTTPS, the `www` redirect and the custom domain** are untested by design: they only exist after the cutover.
- **The privacy notice is a plain-English draft, not legal advice.** A data-protection adviser should read the final version.

## Observations outside the site

- **Companies House lists ZASTRAS LTD's nature of business (SIC) as 64999, "Financial intermediation not elsewhere classified".** That does not describe an AI consultancy. It does not affect the website, but it is worth updating.
- **No DMARC record exists for `zastras.uk`** (SPF and DKIM do). Consider adding one as a separate change after launch; it is deliberately not part of the cutover.
- **The domain's name servers are Google's legacy `googledomains.com` set**, now managed through Squarespace Domains. The cutover checklist is written for that.
