# zastras.uk

Source for the **Zastras Accelerate** website: a one-page site plus two service pages, a privacy notice and retainer terms, built as plain HTML, CSS and a small amount of JavaScript. No framework, no build step, no analytics, no cookies.

> **Status: live and open to search engines.** `https://zastras.uk/` serves this site over HTTPS (DNS switched on 23 November 2026). Every public page can be indexed; only `404.html` carries `noindex`, and `scripts/check-site.mjs` fails the build if that changes. The indexing and SEO work is described under [Search engines](#search-engines) below. Items that are still open (mostly account-level) are in [To-do.md](To-do.md). Nothing in this repository changes DNS or creates search-engine accounts.

| | |
|---|---|
| Live site (GitHub Pages, custom domain) | https://zastras.uk/ (the old preview address https://zastras.github.io/zastras.uk/ now redirects here) |
| Preferred origin, canonical host and sitemap | `https://zastras.uk` (no `www`, always HTTPS, directory URLs end in `/`); sitemap at https://zastras.uk/sitemap.xml |
| Contact form | Formspree, `https://formspree.io/f/maeolban` (public by design) |
| Company | ZASTRAS LTD, registered in Scotland, SC832156 |

## Contents

- [Preview locally](#preview-locally)
- [Repository structure](#repository-structure)
- [Editing the text](#editing-the-text)
- [Replacing the two team images](#replacing-the-two-team-images)
- [The contact form and Formspree](#the-contact-form-and-formspree)
- [Checks](#checks)
- [Search engines](#search-engines)
- [Publishing with GitHub Pages](#publishing-with-github-pages)
- [Domain handover](#domain-handover)
- [Brand](#brand)
- [Licences](#licences)

## Preview locally

Any static file server will do. With Python (already on macOS):

```bash
python3 -m http.server 4173 --directory site
```

Then open <http://localhost:4173>. The site uses only relative paths, so it also works when served from a sub-path, as it is on the GitHub Pages preview (`/zastras.uk/`). To test that, serve the parent folder and open `/zastras.uk/`:

```bash
mkdir -p /tmp/pages && ln -sfn "$PWD/site" /tmp/pages/zastras.uk && python3 -m http.server 4174 --directory /tmp/pages
```

## Repository structure

```
site/                      Everything that is published (this folder is the Pages artifact)
  index.html               The one-page site
  process-review/index.html       Service page: the process review (service 01)
  one-workflow-pilot/index.html   Service page: the one-workflow pilot (service 02)
  privacy/index.html       Privacy notice
  retainer/index.html      Retainer terms
  404.html                 Not-found page
  favicon.ico              Legacy favicon
  robots.txt, sitemap.xml  Search-engine files (absolute URLs on zastras.uk)
  .nojekyll                Tells Pages not to run Jekyll
  assets/
    css/main.css           All styles: design tokens first, then components, in numbered sections
    js/main.js             Mobile menu, "you are here" highlighting, inline form feedback
    fonts/                 Geist and Geist Mono (self-hosted woff2) and their licences
    img/                   Mark, favicons, Open Graph image
    img/team/              The two portrait images (see below)
docs/
  BRAND.md                 The visual identity and the reasoning behind it
  CUTOVER.md              Step-by-step DNS and GitHub Pages launch checklist
  REVIEW.md               Review notes: decisions to confirm, remaining inputs, checks and results
  brand/                   Wordmark lockups, social avatar, and HTML sources for the generated images
  previews/                Desktop and mobile screenshots for review (safe to delete after approval)
scripts/check-site.mjs     Link, metadata, indexing, sitemap, structured-data, form and legal-text checks (Node, no dependencies)
scripts/check-site.test.mjs  Proves each indexing check fails when its rule is broken (node --test)
scripts/verify-live.mjs    Asks the deployed site the same indexing questions: status, redirects, headers, robots, 404
scripts/verify-cutover.mjs Read-only DNS and HTTPS checks used at the domain cutover
.github/workflows/pages.yml  Runs the checks on every push and pull request; deploys main to Pages, then verifies the live site
```

Only `site/` is published. Everything else stays in the repository.

## Editing the text

All copy is in the HTML files under `site/`: `index.html`, `process-review/`, `one-workflow-pilot/`, `privacy/` and `retainer/`. Each section of the home page is a `<section>` with an `id`, in this order:

| `id` | Section |
|---|---|
| `top` | Hero (eyebrow, headline, supporting text, buttons, example workflow) |
| `outcomes` | The four outcomes |
| `what-we-do` | Three services and supporting capabilities |
| `who-we-help` | Example starting points by sector |
| `approach` | The seven-step sequence |
| `team` | The two profile cards |
| `costs` | The three prices (process review, pilot, retainer) and how fees work |
| `contact` | Contact copy and form |

Things to keep in mind when editing:

- **The legal footer** appears in every HTML page and must stay identical. The check script fails if it changes. Before launch, re-verify it against the [Companies House record](https://find-and-update.company-information.service.gov.uk/company/SC832156).
- **Outcomes are not guarantees.** Keep wording such as "might look like" and "how we would check", and do not add statistics, client names, testimonials, certifications or logos that are not real and approved. Banks named in Lex's biography are career history, not clients.
- **Navigation** is duplicated in the header and footer of each page. If you add a section or a page, update both on every page. A new page also needs a line in `site/sitemap.xml` and at least one crawlable link from another page (the check fails on orphans).
- **Prices** are in the `costs` section of `site/index.html`. The retainer range (£400 to £900 a month) is repeated in `site/retainer/index.html`, in the summary and in the fees section; the process review range (£500 to £750) is repeated in `site/process-review/index.html` and the pilot range (£2,000 to £5,000) in `site/one-workflow-pilot/index.html`. Change every place together.
- **Colours and spacing** are CSS custom properties at the top of `main.css`. Change a token there rather than a value in a component.
- **Page titles, descriptions and Open Graph tags** are in each page's `<head>`. Keep the canonical URLs on `https://zastras.uk`. Each page needs its own title, description and `<h1>`; the check fails on duplicates.
- **The service area is deliberately not stated.** The home page names no town or region (the owner removed the Edinburgh and Lothians wording on 24 November 2026), and the registered office in the footer is a company detail, not a place to visit. Do not add an office, a service area or a location-based page without the owner's decision, and do not add structured data that declares an address or opening hours.

After any edit, run the checks (below).

## Replacing the two team images

Both cards are in the `#team` section of `site/index.html`, each with a comment explaining the steps. The images are displayed in a 6:5 frame and cropped with `object-fit: cover`, so any photograph works without changing the layout.

### Lex Sobrinho

Lex's photograph is in place: a 6:5 crop of the supplied headshot, exported as WebP at two sizes (`lex-sobrinho-1200.webp`, about 34 KB, and `lex-sobrinho-600.webp`, about 12 KB) and referenced with `srcset`. The original, much larger PNG is kept out of the repository by `.gitignore`. To swap it for a different photograph without touching the layout:

1. Crop to **6:5** (the frame's shape), face in the upper half, then export two copies: **1200 × 1000 px** and **600 × 500 px**, as WebP or JPEG. For example: `cwebp -q 80 -resize 1200 1000 crop.png -o lex-sobrinho-1200.webp` and the same with `600 500`.
2. **Remove location and camera metadata.** This repository is public. `cwebp` from a PNG leaves none behind; for JPEGs use `exiftool -all= photo.jpg`.
3. Overwrite the two files in `site/assets/img/team/`. If the file names, sizes or format change, update `src`, `srcset`, `width`, `height` and `alt` on the `<img>` in the first card.
4. If the crop cuts off the head, adjust `--portrait-pos` on the surrounding `<figure>` (for example `50% 15%` shows more of the top). A frame that is not exactly 6:5 is cropped by `object-fit: cover`, so nothing breaks.

### Chris Jackson

The second card shows a 6:5 crop of the supplied photograph, zoomed in from the original (`applied-ai-specialist-1200.webp`, about 22 KB, and `applied-ai-specialist-600.webp`, about 9 KB, referenced with `srcset`). The name, role line and biography are the wording the owner supplied on 24 November 2026. The original photograph is kept locally and not committed.

- **To edit the wording**, change the `<h3>`, the role line and the biography in the second card, and the `alt` text on the `<img>`. Keep the `aria-labelledby` and heading `id` pair in step.
- **To swap the photograph**, follow the same steps as for Lex: a 6:5 crop, exported at 1200 × 1000 and 600 × 500 px with no metadata (for example `cwebp -q 80 -crop X Y W H -resize 1200 1000 original.jpg -o applied-ai-specialist-1200.webp`).
- The image file names are generic. They can be renamed under his name if wanted; update `src` and `srcset` to match, and the entry in `scripts/verify-cutover.mjs`.

Also search the repository for the old title, and remember that file names, alt text and commit messages are all public.

## The contact form and Formspree

The form is plain HTML in `site/index.html`:

```html
<form id="contact-form" action="https://formspree.io/f/maeolban" method="POST">
```

- **Without JavaScript** it posts straight to Formspree, which then shows its own confirmation page.
- **With JavaScript** (`assets/js/main.js`) the same form is submitted with `fetch`, asking Formspree for a JSON response. The script validates the fields, shows inline messages, prevents double submission, keeps the visitor's text if anything fails, and reports success only when Formspree returns a success status. Network errors, a 20-second timeout, rate limits and service errors each have their own honest message. If Formspree refuses background submissions because reCAPTCHA is on (see below), the script falls back to a normal form post.
- **Fields:** `name` (required), `email` (required, so Formspree can use it as the reply-to address), `organisation` (optional), `message` (required, 10 to 3000 characters). A hidden `_subject` sets the notification subject line.
- **Spam protection:** a hidden honeypot field named `_gotcha`, which Formspree discards silently when filled in.

### What is public and what is not

The endpoint is a public identifier and is meant to appear in the page source and this repository. **Never commit** a Formspree password, Master API key, inbox credentials or any other secret. The check script fails if it sees credential-like keywords.

### Settings that live in the Formspree dashboard, not in this code

Review these in the Formspree dashboard for the form:

- **Notification recipient.** Where submissions are emailed is set there, not in the HTML. Confirm the address and send a test.
- **Restrict to Domain.** If switched on, only forms hosted on the listed domain may submit; others go to the spam folder. It relies on the `Referer` header, which is why each page sets `<meta name="referrer" content="strict-origin-when-cross-origin">` (do not tighten it to `no-referrer`). **Effect on the preview:** if you set it to `zastras.uk` before cutover, submissions from `zastras.github.io` will be filed as spam. Either leave it off until cutover, or expect preview tests to appear in the spam tab. After cutover, set it to `zastras.uk` (entered without `www`, so both `zastras.uk` and `www.zastras.uk` match).
- **reCAPTCHA.** It is currently **off** for this form (switched off by the owner on 23 November 2026). With it off, the page submits in the background and shows inline confirmation, and spam protection is the honeypot plus Restrict to Domain. **If it is ever switched back on, Formspree refuses background (AJAX) submissions** with `403: In order to submit via AJAX, you need to set a custom key or reCAPTCHA must be disabled`. The page handles that: it detects the response and re-sends the same data as a normal form post, so the visitor passes through Formspree's own CAPTCHA page and the enquiry still arrives. If you do turn it back on, add a sentence about the CAPTCHA to the privacy notice.
- **Data retention, who has access and the UK transfer safeguard** all feed directly into the privacy notice, and Formspree stores every submission until it is deleted by hand. See [To-do.md](To-do.md).

### Testing

Browser success alone does not prove email delivery. After any change to the form, send one clearly labelled test submission and confirm it appears in the Formspree dashboard **and** reaches the notification inbox.

## Checks

```bash
node scripts/check-site.mjs               # everything below; this is what CI runs
node scripts/check-site.mjs --external    # also request every external link (needs network)
node --test scripts/check-site.test.mjs   # proves the indexing checks fail when their rule is broken
node scripts/verify-live.mjs              # asks https://zastras.uk the same questions (needs network)
```

The scripts have no dependencies (Node 18 or later). `check-site.mjs` always runs in strict mode, because the site is published. It checks:

- **Structure:** every local link, image and anchor resolves; no root-relative paths (which would break on the Pages preview); ids are unique and ARIA references exist; headings do not skip levels; images have `alt`, `width` and `height`; every form control has a label; the form action and method are exactly right; the legal footer is intact; no credential-like text.
- **Indexing:** no public page has a robots meta tag containing `noindex`, `none`, `nofollow` or `nosnippet`; the 404 page keeps its `noindex`; no `PREVIEW-NOINDEX` marker, draft banner, owner-decision box or bracketed placeholder remains; "Last updated" lines hold a real date that is not in the future; `robots.txt` disallows nothing and names the sitemap.
- **URLs:** each page has exactly one canonical link, equal to `https://zastras.uk/<path>/` and to its `og:url`; the sitemap lists each public page once, in canonical form, and lists nothing that is `noindex`, missing or not canonical; no link, tag or file uses `www`, `http://zastras.uk` or the `zastras.github.io` address; links to directories end in `/` and never name `index.html`; every public page is reachable from the home page by ordinary links.
- **Metadata:** titles, descriptions and `<h1>`s are present and unique; the Open Graph image exists and its stated size matches the file.
- **Structured data:** every JSON-LD block parses, uses only the approved schema types (not `LocalBusiness` or its subtypes), declares no address, opening hours, telephone, rating or review, and `Service` descriptions appear word for word on the page.
- **Privacy posture:** nothing loads from another host (scripts, styles, fonts, images, frames), and none of the usual analytics, advertising or web-font services are named anywhere.

`check-site.test.mjs` copies the site, makes one deliberate mistake per test (adds `noindex`, a draft banner, a wrong canonical, a broken JSON-LD block, a Google Fonts link and so on) and expects the check to fail with the right message. If you change a rule, change its test too; do not loosen a rule to make a build pass.

`verify-live.mjs` reads the deployed sitemap and, for each URL, checks the status code, `X-Robots-Tag` header, robots meta tag, canonical URL, title, `<h1>` and navigation in the served HTML; it checks that `http://`, `www` and the old `zastras.github.io` address each redirect once to `https://zastras.uk/`, that a missing URL returns a real 404 with `noindex`, and that CSS, JavaScript, images and fonts are fetchable. CI runs it after every deployment and retries for a couple of minutes while GitHub's cache catches up.

The same checks run in CI on every push and pull request. They do not replace looking at the site: see [docs/REVIEW.md](docs/REVIEW.md) for what was checked by hand and in a browser, and what was not.

## Publishing with GitHub Pages

Publishing uses GitHub Actions (`.github/workflows/pages.yml`):

- **Pull requests:** run the checks and the check tests only.
- **Pushes to `main`** and **manual runs:** run the checks, publish the `site/` folder, then run `scripts/verify-live.mjs` against `https://zastras.uk`.

One-time setup, already done for this repository: *Settings, Pages, Build and deployment, Source: GitHub Actions*. The site is served at `https://zastras.uk/` (the custom domain); the old address `https://zastras.github.io/zastras.uk/` redirects to it.

To publish a branch for review before merging, run the workflow manually against it (Actions, *Check and deploy site*, *Run workflow*, choose the branch). The `github-pages` environment only accepts branches listed under *Settings, Environments, github-pages, Deployment branches*, so add the branch there first. Remove the entry afterwards.

Because the workflow publishes from Actions, GitHub does **not** use a `CNAME` file. The custom domain is configured in the Pages settings page at cutover (see below).

## Search engines

All public pages are indexable. Pages are kept out of search in one way only, and only where that is intended: `404.html` has `<meta name="robots" content="noindex">` and is served, with a real HTTP 404, for addresses that do not exist. GitHub Pages cannot send an `X-Robots-Tag` header, and `robots.txt` is not used to hide anything (a crawler must be allowed to fetch a page to see its `noindex`, and needs the CSS, JavaScript and images to render it). The check script fails if any other page gains a blocking directive; a deliberate future exception would need a visible change to that script.

- **Preferred URLs:** `https://zastras.uk/` and `https://zastras.uk/<page>/`. `http://`, `www.zastras.uk` and the old `zastras.github.io` address each redirect once (301) to the preferred form; `/privacy` redirects once to `/privacy/`. Canonical links, `og:url`, the sitemap and structured data all use the same form. The Pages custom domain is set in the repository settings; there is no `CNAME` file.
- **Sitemap:** `site/sitemap.xml` lists the five public pages and no `<lastmod>`, because the dates would have to be kept accurate by hand and an inaccurate date is worse than none. If dates are added later, they must change only when a page's content meaningfully changes (the check rejects malformed or future dates).
- **Structured data:** the home page declares an `Organization` and a `WebSite` (name, legal name, URL, logo, description). The two service pages each declare a `Service`. The business is described as an organisation, not a local business, because the registered office is not a place the public can visit. Do not add an address, opening hours, ratings, reviews or a telephone number.
- **Titles and descriptions** are specific to each page and unique across the site. The service pages exist to answer the questions a prospective client has about one service (who it is for, what happens, what you receive, safeguards, limits, cost and next step); do not add near-identical pages for towns or sectors.
- **Search Console and other accounts** are not set up by this repository. The site URL to add is `https://zastras.uk/` and the sitemap is `https://zastras.uk/sitemap.xml`. Do not add verification files or tags to `site/` without the owner's say-so; prefer a DNS verification record.

## Domain handover

`zastras.uk` has pointed at GitHub Pages since 23 November 2026. Email (MX, SPF, DKIM) still runs on Google and must not be touched by any website change. The record of the switch, the checks and the rollback steps are in **[docs/CUTOVER.md](docs/CUTOVER.md)**.

## Brand

The mark, wordmark, palette, typography and component rules, and the reasons for them, are in [docs/BRAND.md](docs/BRAND.md).

## Licences

- **Fonts:** Geist and Geist Mono are licensed under the SIL Open Font License 1.1 (see `site/assets/fonts/OFL-*.txt`).
- **Everything else:** no open-source licence is attached. The repository is public so GitHub Pages can serve it from a free organisation, but the copy, mark and design are not offered for reuse.
