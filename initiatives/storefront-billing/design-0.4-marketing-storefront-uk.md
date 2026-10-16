# Design round 0.4 — MARKETING: the Ukrainian storefront, the language switch and the fonts (carry FIRST)

## Context

The Discipline Program is a CrossFit coaching product. Its public marketing site
(`apps/marketing`, Next.js + MUI 7, repo `maksim-pokhiliy/the-discipline-program` on `main`)
sells the coach's training programs: a home page, a Storefront page with the program cards,
About, FAQ, Blog, Contact. Every buyer is in Ukraine today; the site is English only. The
card-acquiring provider requires a Ukrainian version of the pages a buyer touches, and the
decision is that the content is translated by the coach in the CMS (English stays the
default and keeps today's URLs; Ukrainian lives under `/uk/…`; any section the coach has
not translated yet shows in English).

This prototype designs the Ukrainian storefront as the reference page for the whole
localized site: the header with the language switch, the program card with a photo, the
product details dialog, the lead form, the footer, and the 404 page — in Ukrainian.

## The page today (keep its structure)

`/storefront`: a full-screen hero (background image, title, subtitle, a button) → a grid
of program cards (title, price with the period, description, a list of features with check
marks, a "Learn more" button; the featured program has a tinted header) → a CTA section.
Tapping a card opens a details dialog (price, description, features, "Close" / "Get
started"); "Get started" opens the lead form (name, contact, message, "Send"). The header
is a transparent bar with the logo, a centered pill of navigation links on desktop and a
drawer on mobile. The footer: logo, tagline, a short line and the copyright.

## What changes

1. **Language switch** in the header (and in the mobile drawer): English / Українська,
   driven by the list of enabled languages (there may be a third one day). It changes the
   whole page and the URL (`/storefront` ↔ `/uk/storefront`). Decide its form (two-letter
   codes, native names, a globe icon) and where it sits next to a centered nav pill.
2. **Ukrainian typography.** The site's fonts are Barlow and Barlow Condensed, which have
   no Cyrillic glyphs: today Ukrainian text would fall into a system font. Pick the type
   pairing for the site — one pairing for every language, not a per-language font — that
   keeps the current condensed, athletic character of the headlines and reads well in
   Ukrainian and English. Show the hero, the card header and body copy in both languages
   with the chosen fonts. Google Fonts are the delivery channel (the app uses `next/font`).
3. **The product card with a photo.** Each program gains a photo (the admin lets the coach
   upload one). Place it on the card and in the details dialog; keep the price and period
   legible. The price in Ukrainian renders as `1 500,00 ₴` and the period as `4 тижні`;
   in English `₴1,500.00` and `4 weeks` — design for both widths.
4. **Fallback state.** A section still in English on the Ukrainian page is normal; decide
   whether the visitor sees any mark at all (recommendation: none — the coach sees it in the
   admin) and make sure mixed-language pages do not look broken.
5. **Chrome strings** become CMS data too: navigation labels, footer texts, the lead form's
   labels and success/error messages, the 404 / error page. Write the Ukrainian microcopy for
   all of them as part of the spec (the coach will refine it in the admin).

## Edge cases to design for

320px and 390px phone widths with the switch in the drawer; a program title of 60
characters in Ukrainian in the card header; four cards where one has no photo; a price of
`12 000,00 ₴`; the hero with a long Ukrainian subtitle in the condensed display font.

## Rails

MUI 7 and the project's theme tokens; the existing page structure and components (the
cards, dialog, lead form are reused — restyle, do not reinvent); no new brand colors; the
blog stays English on both languages (link it from the Ukrainian nav with a Ukrainian label,
content in English); phone-first, desktop inherits.

## Deliverable

An interaction and type spec: the language switch (header + drawer, states), the chosen
font pairing with the Cyrillic proof, the card and dialog with a photo in both languages,
the lead form and 404 in Ukrainian, the complete Ukrainian microcopy for the chrome, and
phone + desktop mockups of `/uk/storefront` with one card falling back to English.
