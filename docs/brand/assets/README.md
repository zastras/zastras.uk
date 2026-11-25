# Zastras brand asset pack

Ready-to-use files for LinkedIn, documents, slides and the website. Rules for using them (clear space, minimum size, colours, fonts) are in [../../BRAND.md](../../BRAND.md).

## logo/

| File | What it is | Use it for |
|---|---|---|
| `zastras-lockup-on-dark.svg` / `.png` | Mark, **Zastras** and ACCELERATE, transparent | Dark backgrounds. The SVG has the type converted to outlines, so it needs no fonts and scales to any size, including print. The PNG is 1468 × 608. |
| `zastras-lockup-on-light.svg` / `.png` | Same lockup with dark type | White and light backgrounds |
| `zastras-mark.svg` | The mark on its rounded navy tile, vector | The logo on its own, any size |
| `zastras-mark-128.png` … `-1024.png` | The same tile as PNG, transparent corners | Slides, documents, anywhere a raster is needed |
| `zastras-avatar.svg`, `zastras-avatar-512.png`, `-1024.png` | Full-bleed navy square with the mark at about 50% of the width | Profile pictures. Safe under square, rounded and circular crops. |

The tile carries its own navy background, so the mark and the lockups work on any surface.

## linkedin/

| File | Size | Where it goes |
|---|---|---|
| `linkedin-logo-400x400.png` | 400 × 400 | Company page logo (LinkedIn asks for at least 300 × 300) |
| `linkedin-cover-1128x191.png` | 1128 × 191 | Company page cover image, at LinkedIn's size |
| `linkedin-cover-2256x382.png` | 2256 × 382 | The same cover at double size, if you want it sharper on high-resolution screens |
| `linkedin-share-1200x630.png` | 1200 × 630 | An image for a post or a shared link (LinkedIn's guide is 1200 × 627; this is the site's Open Graph image) |

The cover leaves the left 270 px empty on purpose, because LinkedIn lays the company logo over that corner (more of it on mobile). The headline is the site's: "AI that earns its place in your business." Its source is `../source/linkedin-cover.html`.

Sizes are LinkedIn's recommendations as we understand them. If its upload screen suggests something different, the logo and cover can be re-rendered at any size from the sources.

## site/

The identity files the website uses, collected in one place.

| File | Use |
|---|---|
| `favicon.svg` | Browser tab icon (heavier cut for small sizes) |
| `favicon.ico`, `favicon-16.png`, `-32.png`, `-48.png` | Legacy favicon and its three sizes |
| `apple-touch-icon.png` | iOS home-screen icon, 180 px, full-bleed |
| `og-image.png` | Link preview image for sharing the site, 1200 × 630 |

`favicon.svg`, `favicon.ico` and the three PNGs are the same files the website now serves from `site/`. An earlier build had two defects, fixed on 2026-11-25: the SVG's navy tile never drew (its rectangle had no width or height), and the ICO's 32 and 48 px entries showed a browser's broken-image icon while the 16 px one was blank.

## Colours

| Name | Hex | |
|---|---|---|
| Navy 900 | `#0a1222` | Main dark surface, dark text on light |
| Navy 950 | `#060b16` | Deepest surface |
| Paper | `#f4f7fb` | Main light surface |
| Blue 300 | `#8da8ff` | Accent on dark, the start node of the mark |
| Blue 600 | `#2650e6` | Buttons and links on light |
| Teal 400 | `#3ddcc8` | The checkpoint ring: where a person decides |
| Mist | `#b7c3d8` | Secondary text on navy |

The full palette with contrast ratios is in [../../BRAND.md](../../BRAND.md#colour).

## Fonts

**Geist** and **Geist Mono** (SIL Open Font Licence). The website serves them as latin subsets from `site/assets/fonts/`, with the licences alongside. Those subsets are web fonts (woff2), so for Canva, PowerPoint or similar, install the full families from the Geist project.

## Not included

The two team photographs stay in `site/assets/img/team/` only. They show people, so they are not part of a brand pack. The hero workflow panel on the home page is live HTML and CSS rather than an image file.
