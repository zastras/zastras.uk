# zastras.uk

Source for the **Zastras Practical AI** website: a one-page site plus a privacy notice, built as plain HTML, CSS and a small amount of JavaScript. No framework, no build step, no analytics, no cookies.

> **Status: preview only.** The live domain, `zastras.uk`, still serves the Squarespace holding page. Nothing in this repository changes DNS. Publication follows [docs/CUTOVER.md](docs/CUTOVER.md) after the owner approves the design, copy and privacy notice.

| | |
|---|---|
| Preview (GitHub Pages) | https://zastras.github.io/zastras.uk/ (marked `noindex` until launch) |
| Intended production URL | https://zastras.uk |
| Contact form | Formspree, `https://formspree.io/f/maeolban` (public by design) |
| Company | ZASTRAS LTD, registered in Scotland, SC832156 |

## Contents

- [Preview locally](#preview-locally)
- [Repository structure](#repository-structure)
- [Editing the text](#editing-the-text)
- [Replacing the two team images](#replacing-the-two-team-images)
- [The contact form and Formspree](#the-contact-form-and-formspree)
- [Checks](#checks)
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
  privacy/index.html       Privacy notice (draft, with owner-decision boxes)
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
scripts/check-site.mjs     Link, metadata, form and legal-text checks (Node, no dependencies)
.github/workflows/pages.yml  Runs the checks on every push and pull request; deploys main to Pages
```

Only `site/` is published. Everything else stays in the repository.

## Editing the text

All copy is in `site/index.html` and `site/privacy/index.html`. Each section of the home page is a `<section>` with an `id`, in this order:

| `id` | Section |
|---|---|
| `top` | Hero (eyebrow, headline, supporting text, buttons, example workflow) |
| `outcomes` | The four outcomes |
| `what-we-do` | Three services and supporting capabilities |
| `who-we-help` | Example starting points by sector |
| `approach` | The seven-step sequence |
| `team` | The two profile cards |
| `contact` | Contact copy and form |

Things to keep in mind when editing:

- **The legal footer** appears in both HTML files and must stay identical. The check script fails if it changes. Before launch, re-verify it against the [Companies House record](https://find-and-update.company-information.service.gov.uk/company/SC832156).
- **Outcomes are not guarantees.** Keep wording such as "might look like" and "how we would check", and do not add statistics, client names, testimonials, certifications or logos that are not real and approved. Banks named in Lex's biography are career history, not clients.
- **Navigation** is duplicated in the header and footer of each page. If you add a section, update both, plus `privacy/index.html`.
- **Colours and spacing** are CSS custom properties at the top of `main.css`. Change a token there rather than a value in a component.
- **Page titles, descriptions and Open Graph tags** are in each page's `<head>`. Keep the canonical URLs on `https://zastras.uk`.

After any edit, run the checks (below).

## Replacing the two team images

Both cards are in the `#team` section of `site/index.html`, each with a comment explaining the steps. The images are displayed in a 6:5 frame and cropped with `object-fit: cover`, so any photograph works without changing the layout.

### Lex Sobrinho

Lex's photograph is in place: a 6:5 crop of the supplied headshot, exported as WebP at two sizes (`lex-sobrinho-1200.webp`, about 34 KB, and `lex-sobrinho-600.webp`, about 12 KB) and referenced with `srcset`. The original, much larger PNG is kept out of the repository by `.gitignore`. To swap it for a different photograph without touching the layout:

1. Crop to **6:5** (the frame's shape), face in the upper half, then export two copies: **1200 × 1000 px** and **600 × 500 px**, as WebP or JPEG. For example: `cwebp -q 80 -resize 1200 1000 crop.png -o lex-sobrinho-1200.webp` and the same with `600 500`.
2. **Remove location and camera metadata.** This repository is public. `cwebp` from a PNG leaves none behind; for JPEGs use `exiftool -all= photo.jpg`.
3. Overwrite the two files in `site/assets/img/team/`. If the file names, sizes or format change, update `src`, `srcset`, `width`, `height` and `alt` on the `<img>` in the first card.
4. If the crop cuts off the head, adjust `--portrait-pos` on the surrounding `<figure>` (for example `50% 15%` shows more of the top). A frame that is not exactly 6:5 is cropped by `object-fit: cover`, so nothing breaks.

### The applied AI specialist

The card deliberately shows an abstract graphic (`applied-ai-specialist.svg`) and the public title only. **Do not add a name, initial or any identifying detail until the person has agreed to be named.** When they have:

1. Follow the same photograph steps (6:5 crop, two sizes, metadata removed), saving the files under their name (for example `firstname-lastname-1200.webp`).
2. In the second card, replace the `<img>` (`src`, `width`, `height`, `alt`), the `<h3>`, the role line and the biography.
3. Keep the `aria-labelledby` and `id` pair in step if you rename the heading's `id`.
4. Remove `applied-ai-specialist.svg`.

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
- **Data retention and who has access** to the Formspree account feed directly into the privacy notice. Resolve them together.

### Testing

Browser success alone does not prove email delivery. After any change to the form, send one clearly labelled test submission and confirm it appears in the Formspree dashboard **and** reaches the notification inbox.

## Checks

```bash
node scripts/check-site.mjs               # structure, links and anchors, metadata, form, legal text
node scripts/check-site.mjs --external    # also request every external link (needs network)
node scripts/check-site.mjs --production  # also fail on anything that must not ship (see below)
```

The script has no dependencies (Node 18 or later). It checks that every local link, image and anchor resolves; that there are no root-relative paths (which would break on the Pages preview); that ids are unique and ARIA references exist; that each page has a title, description, canonical URL and Open Graph tags; that headings do not skip levels; that images have `alt`, `width` and `height`; that every form control has a label; that the form action and method are exactly right; that the legal footer is intact; that the sitemap and robots file match the pages; and that no credential-like text is present.

`--production` additionally fails if a `noindex` tag, an owner-decision box, a draft banner or a bracketed placeholder such as `[retention period to be decided]` is still present. It is expected to fail until the launch steps in [docs/CUTOVER.md](docs/CUTOVER.md) are complete.

The same checks run in CI on every push and pull request. They do not replace looking at the site: see [docs/REVIEW.md](docs/REVIEW.md) for what was checked by hand and in a browser, and what was not.

## Publishing with GitHub Pages

Publishing uses GitHub Actions (`.github/workflows/pages.yml`):

- **Pull requests:** run the checks only.
- **Pushes to `main`** and **manual runs:** run the checks, then publish the `site/` folder.

One-time setup, already done for this repository: *Settings, Pages, Build and deployment, Source: GitHub Actions*. The preview is served at `https://zastras.github.io/zastras.uk/`.

To publish a branch for review before merging, run the workflow manually against it (Actions, *Check and deploy site*, *Run workflow*, choose the branch). The `github-pages` environment only accepts branches listed under *Settings, Environments, github-pages, Deployment branches*, so add the branch there first. Remove the entry afterwards.

Because the workflow publishes from Actions, GitHub does **not** use a `CNAME` file. The custom domain is configured in the Pages settings page at cutover (see below).

Every page carries `<meta name="robots" content="noindex, nofollow">` on a line marked `PREVIEW-NOINDEX`, so the preview stays out of search results. `robots.txt` cannot do this job on a project site because it is not served from the host root. The line is removed as a deliberate final step at launch.

## Domain handover

`zastras.uk` currently points at Squarespace and must keep doing so until the owner approves. The full sequence, including inventorying and preserving the existing DNS records (MX, SPF, DKIM) so email keeps working, is in **[docs/CUTOVER.md](docs/CUTOVER.md)**. Do not start it without the owner's go-ahead.

## Brand

The mark, wordmark, palette, typography and component rules, and the reasons for them, are in [docs/BRAND.md](docs/BRAND.md).

## Licences

- **Fonts:** Geist and Geist Mono are licensed under the SIL Open Font License 1.1 (see `site/assets/fonts/OFL-*.txt`).
- **Everything else:** no open-source licence is attached. The repository is public so GitHub Pages can serve it from a free organisation, but the copy, mark and design are not offered for reuse.
