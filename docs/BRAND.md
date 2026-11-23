# Brand: Zastras Practical AI

The identity has to do two jobs at once: feel unmistakably current and AI-aware, and reassure a law-firm partner or practice manager that the people behind it are sober and careful. Every choice below is made to serve both.

## The idea

**Useful AI, implemented with the judgement and controls that real businesses need.**

Visually, that becomes two ideas working together:

1. **Connected workflows.** Fine grids, nodes and links stand for structured information moving through a process. This is the "AI-aware" half, expressed as diagrams rather than as robots, brains or circuit boards.
2. **A person at the checkpoint.** In the mark and in the hero illustration, one node is different: a ring in teal, where the work pauses and a person decides. This is the "professionally sober" half, and it is the product's central promise made visible.

## The mark

A **Z drawn as a single connected path**. It begins at a solid blue node and ends at a teal ring.

- The path reads as a workflow: input at one end, an outcome at the other, with turns along the way.
- The ring at the end is the human checkpoint. It is the only teal element, so the eye lands there.
- It stays legible at 16 px (the favicon is a slightly heavier cut) and works as a square or circular avatar.

The mark sits on a deep-navy rounded tile with a hairline blue edge so that it holds its shape on both dark and light backgrounds.

Files:

| File | Use |
|---|---|
| `site/assets/img/logo-mark.svg` | Master mark (tile), vector |
| `site/assets/img/favicon.svg` | Browser tab icon (heavier cut for small sizes) |
| `site/favicon.ico` | Legacy favicon (16, 32 and 48 px) |
| `site/assets/img/apple-touch-icon.png` | iOS home-screen icon, 180 px, full-bleed |
| `site/assets/img/logo-mark-512.png` | Raster mark used in structured data |
| `docs/brand/avatar-512.png` | Social avatar: full-bleed navy, mark at about 50 percent of the width, safe for circular crops |

## The wordmark

**Zastras** set in Geist at weight 650 with tight tracking, over **PRACTICAL AI** in Geist Mono, widely spaced, in light blue. The two lines carry the two registers of the brand: a confident name, and a quiet technical descriptor.

On the site the wordmark is live text beside the mark. Pre-rendered lockups for other uses are in `docs/brand/`:

- `lockup-on-dark.png`, for dark backgrounds (transparent)
- `lockup-on-light.png`, for light backgrounds (transparent)

The lockups are PNG because the type has not been converted to outlines. If vector lockups are needed (for print or signage), open the source in `docs/brand/source/lockup.html` and outline the text in a design tool, or ask for a vector version.

**Clear space:** keep at least the height of the tile's ring node free on all sides. **Minimum size:** mark 16 px; full lockup 120 px wide. **Do not:** recolour the mark outside the palette, stretch it, add effects, or place it on busy imagery.

## Colour

A deep navy and graphite foundation, cool light surfaces, and three accents used sparingly. Contrast ratios are measured against the surface shown.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--navy-900` | `#0a1222` | Primary dark surface, body text on light | 17:1 with white |
| `--navy-950` | `#060b16` | Deepest surface (footer, services) | |
| `--navy-800` / `-700` / `-600` | `#0f1a2f` / `#16243d` / `#20324f` | Cards and layers on dark | |
| `--paper` | `#f4f7fb` | Main light surface | 17:1 with navy |
| `--white` | `#ffffff` | Cards on light | |
| `--ink-muted` | `#44546c` | Secondary text on light | 7:1 on paper |
| `--mist` | `#b7c3d8` | Secondary text on navy | 10:1 on navy-900 |
| `--blue-300` | `#8da8ff` | Accent text, nodes and focus rings on dark | 8:1 on navy-900 |
| `--blue-600` | `#2650e6` | Buttons and links on light | 6.2:1 with white |
| `--teal-400` | `#3ddcc8` | The checkpoint, eyebrows and highlights on dark | 11:1 on navy-900 |
| `--teal-700` | `#0b7a72` | Teal text on light | 5:1 on white |
| `--violet-400` | `#9a8cff` | Reserved for gradients; not used for text | |

Rules: teal always means "a person decides" or "outcome"; blue means "flow" and interaction; amber is used only for internal review notes and never in the public design.

The rendered text on every page was measured pixel by pixel against its actual background (including gradients and glows) and meets WCAG 2.2 AA. See [REVIEW.md](REVIEW.md).

## Typography

**Geist** for headings, interface and body; **Geist Mono** for small technical labels (eyebrows, step numbers, tags). One family with a matching mono keeps the page coherent and distinctive without a second personality. Both are variable fonts, self-hosted as latin woff2 subsets (about 29 KB and 23 KB), so there are no third-party font requests.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display (h1) | 2.45 to 4.6 rem, fluid | 600 | -0.038em |
| Section heading (h2) | 1.85 to 2.95 rem, fluid | 600 | -0.03em |
| Card heading (h3) | 1.25 rem | 600 | -0.012em |
| Lead paragraph | 1.1 to 1.3 rem | 400 | normal |
| Body | 1.0625 rem (17 px), line height 1.65 | 400 | normal |
| Label (mono) | 0.7 to 0.75 rem, uppercase | 500 | 0.09 to 0.14em |

Body text is never smaller than 15 px, and line length is capped for reading comfort.

## Components

Defined once in `site/assets/css/main.css`, in this order of the file: tokens, base, layout, buttons, header, hero, section patterns, outcomes, services, sectors, approach, team, form, footer, privacy page.

- **Buttons:** primary (solid blue, white text), ghost (outlined, for dark surfaces), outline (for light surfaces). 48 px tall, 12 px radius, clear focus ring.
- **Cards:** white, hairline border, soft shadow, a two-pixel blue-to-teal rule at the top edge.
- **Dark glass panels:** translucent navy with a blue hairline, used for the hero illustration and the three services.
- **Section treatment:** alternating dark and light bands. Dark bands carry a faint grid that fades out, the visual shorthand for "structured information".
- **Form:** light card on a dark band; 48 px fields with a 3.6:1 border; errors use red text with an icon and message, never colour alone.
- **Callouts and notes:** a left accent rule (blue for information, teal for privacy and safeguards).

## Imagery and graphics

Used: the grid texture, nodes and links, the example workflow panel, line icons in one consistent weight, an abstract node-graph graphic in place of the applied AI specialist's portrait, and a dashed-guide placeholder where Lex's photograph will go.

Avoided on purpose: robot faces, glowing brains, circuit-board stock art, server-room photographs, neon, gradients behind long text, and any fabricated human portrait. The portrait placeholders are clearly designed objects, not photographs.

## Motion

One purposeful animation: the hero's example workflow assembles step by step once on load, so the order of events and the human checkpoint are visible. Nothing loops. Hover states are short transitions. With `prefers-reduced-motion: reduce`, all animation and smooth scrolling are switched off and the content simply appears.

## Open Graph image

`site/assets/img/og-image.png` (1200 × 630): the lockup, the eyebrow, the headline with the same blue-to-teal emphasis as the site, and a vertical workflow motif ending in the teal checkpoint. Source: `docs/brand/source/og-image.html`. To regenerate, open that file in Chrome at a 1200 × 630 viewport and take a screenshot.

The page metadata points at `https://zastras.uk/assets/img/og-image.png`, so the image will unfurl properly once the domain is live, not on the preview URL.

## Regenerating assets

The HTML sources in `docs/brand/source/` (`og-image.html`, `avatar.html`, `lockup.html`) load the fonts from `site/assets/fonts/`. Open them in Chrome and screenshot at the stated size. The favicon PNGs in `docs/brand/source/` were rendered from `favicon.svg` and combined into `site/favicon.ico`.
