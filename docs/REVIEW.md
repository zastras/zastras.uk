# Review notes

For the owner's review of the first version of the site. Written 23 November 2026. Nothing here has gone live: `zastras.uk` still serves the Squarespace holding page and no DNS record has been changed.

## What to look at

| What | Where |
|---|---|
| Live preview (marked `noindex`) | https://zastras.github.io/zastras.uk/ and https://zastras.github.io/zastras.uk/privacy/ |
| Desktop, full page | [previews/desktop-home.jpg](previews/desktop-home.jpg), [previews/desktop-privacy.jpg](previews/desktop-privacy.jpg) |
| Mobile, key screens and the open menu | [previews/mobile-overview.jpg](previews/mobile-overview.jpg) |
| The reasoning behind the visual identity | [BRAND.md](BRAND.md) |
| How to launch | [CUTOVER.md](CUTOVER.md) |

## Two things that need a decision before the form can be tested end to end

### 1. Formspree is refusing background (AJAX) submissions

A real submission from the preview page was rejected by Formspree with HTTP 403:

> In order to submit via AJAX, you need to set a custom key or reCAPTCHA must be disabled in this form's settings page.

So **reCAPTCHA is switched on for this form** (Formspree's default). Nothing was delivered: the page correctly showed an error and kept the visitor's text.

What the site does now: when it sees exactly that response, it re-sends the same data as a normal form post. The visitor passes through Formspree's own CAPTCHA page and the enquiry then arrives. That works, but it takes the visitor off the site and puts a Google reCAPTCHA step between them and the form.

The decision (it is a setting in the Formspree dashboard, which this work cannot see or change):

- **Turn reCAPTCHA off** for the form. Visitors then stay on the page and get inline confirmation. Spam protection is the hidden honeypot plus Restrict to Domain (set it to `zastras.uk` at cutover, see below). This is what the brief's "honeypot" approach assumes.
- **Or leave it on** and accept the redirect. Then the privacy notice's CAPTCHA sentence stays.
- **Or add your own reCAPTCHA key** in Formspree. That adds a Google script to the page, which the brief prefers to avoid.

### 2. The labelled end-to-end test submission has not yet succeeded

The brief asks for one clearly labelled test submission, then for the owner to confirm it in Formspree and the inbox. The one attempt was rejected as above, so **nothing should have arrived**. Once reCAPTCHA is off (or you choose another route), one labelled test can be re-sent from the preview, and you can confirm it:

- appears in the Formspree dashboard (check the *Spam* tab as well as the main one); and
- reaches the notification inbox. Browser success alone does not prove email delivery.

If you would rather test it yourself now, fill in the form on the preview and complete the CAPTCHA on the Formspree page. A test from the preview domain will be filed as spam if *Restrict to Domain* is already set to `zastras.uk`; leave it unset until cutover.

## Decisions made on your behalf

None of these were in the brief. Each is easy to reverse; say if you want any changed.

**Hosting and tooling**

- **The repository is public.** GitHub Pages is only available for public repositories on a free organisation plan. The code contains nothing secret (the Formspree endpoint is public by design).
- **Fonts:** Geist and Geist Mono (SIL Open Font License), self-hosted as latin woff2 subsets (29 KB and 23 KB). No Google Fonts or other third-party requests.
- **Commits use GitHub's no-reply address**, so no personal email address is published in the history.
- **Temporary workflow trigger:** `.github/workflows/pages.yml` also deploys the `build/initial-site` branch so the preview exists before anything is merged. Remove that branch from the workflow, and from *Settings, Environments, github-pages, Deployment branches*, when the pull request is merged.

**Copy and content added beyond the brief** (all framed as things to investigate, none as results)

- A positioning line under the hero, followed by a short paragraph saying we do not sell a catalogue of tools.
- Under each outcome, a "How we would check" line (for example "Minutes per task, before and after, on real examples").
- Under each service, a "You get" line, and one-line explanations for each of the seven approach steps.
- Three short principles under the hero buttons: "One workflow at a time", "A person reviews what matters", "Measured against a baseline".
- The hero illustration: a four-step enquiry-handling example (a tenant reporting a leaking tap), explicitly labelled "Illustration" with a note that every workflow starts from the firm's own process.
- A three-step "what happens next" in the contact section, without any promised response time.
- A footnote on Lex's card: the organisations named describe previous career experience, and none is a client or endorser.
- "No pressure, and no obligation" in the contact copy.
- The second profile's role line, **"Applied AI | Security-minded implementation"**, which is derived from the brief's biography rather than supplied. The brief only gave a title and a placeholder for the name. Change or remove it freely.
- Line icons for the outcomes and sectors.

**Privacy notice** (all marked for review on the page itself)

- It states that enquiries are not used to build a mailing list and that details are not sold.
- It states a one-month response time for rights requests (the statutory period).
- It offers "the contact form, or post to the registered office" as the route for privacy requests, because no public email address exists yet.
- It names GitHub Pages hosting and mentions that GitHub logs visitor IP addresses for security, which GitHub's own documentation states.
- Left blank on purpose, as amber owner-decision boxes: lawful basis, ICO fee or registration, retention period, notification email service, who has access, international transfer safeguard, CAPTCHA, data-processing terms, a dedicated privacy address, the last-updated date.

## Remaining inputs

| Input | Where it goes |
|---|---|
| **Lex's photograph** | Replace the placeholder in the first team card. Steps: [README, "Replacing the two team images"](../README.md#replacing-the-two-team-images). Strip location metadata first; the repository is public. |
| **The applied AI specialist's name and photograph** | Only when that person agrees. Until then the card shows the abstract graphic and the title. Nothing identifying is in the repository, including file names, alt text and commit history. |
| **Public contact address**, if one is to be shown | The contact section and the privacy notice. Today the form is the only route, and the error messages do not offer a fallback address. |
| **Notification inbox confirmation** | Confirm in Formspree where notifications go, who can access them, then test (see above). |
| **Final privacy-notice decisions** | The amber boxes on the privacy page. |
| **reCAPTCHA decision** | See "Two things that need a decision", above. |
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
| Formspree delivery | One real submission from the preview | **Rejected (403, reCAPTCHA).** Not delivered. See above |

## Not verified

Be aware of the limits of the above:

- **No real screen reader** (VoiceOver, NVDA, JAWS) was used. Automated rules, keyboard testing and semantic markup give good confidence, but they are not a substitute.
- **Browsers:** tested in current Chrome only (headless). Safari and Firefox were not tested. Nothing exotic is used, but `backdrop-filter` and `text-wrap` fall back gracefully rather than being tested.
- **Real devices:** mobile was tested by viewport emulation, not on phones or tablets.
- **Email delivery** has not been confirmed, because the one submission was rejected.
- **Share previews** (the Open Graph card) cannot be tested until the domain is live, because the metadata points at `https://zastras.uk/assets/img/og-image.png`.
- **HTTPS, the `www` redirect and the custom domain** are untested by design: they only exist after the cutover.
- **The privacy notice is a plain-English draft, not legal advice.** A data-protection adviser should read the final version.

## Observations outside the site

- **Companies House lists ZASTRAS LTD's nature of business (SIC) as 64999, "Financial intermediation not elsewhere classified".** That does not describe an AI consultancy. It does not affect the website, but it is worth updating.
- **No DMARC record exists for `zastras.uk`** (SPF and DKIM do). Consider adding one as a separate change after launch; it is deliberately not part of the cutover.
- **The domain's name servers are Google's legacy `googledomains.com` set**, now managed through Squarespace Domains. The cutover checklist is written for that.
