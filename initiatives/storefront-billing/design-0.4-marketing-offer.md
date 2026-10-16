# Design round 0.4 — MARKETING: the Offer and requisites page (carry SECOND)

## Context

The Discipline Program is a CrossFit coaching product whose public marketing site
(`apps/marketing`, Next.js + MUI 7, repo `maksim-pokhiliy/the-discipline-program` on
`main`) sells the coach's training programs. To accept card payments in Ukraine the site
must carry a public offer with the seller's requisites (the acquiring provider's checklist:
"інформація про компанію, наприклад розділ Про нас або оферта"). The coach fills the
content in the CMS; the sibling storefront prototype sets the Ukrainian typography and the
language switch — follow it.

## The page

A new page, `/offer` (English) and `/uk/offer` (Ukrainian), linked from the footer on every
page and from the details dialog / checkout entry of a program. Its content, all editable
by the coach per language:

- a **hero**: title and a one-line subtitle (no button, no background image required);
- **requisites**: a list of label + value rows — the sole proprietor's full name, the tax
  id (ІПН / РНОКПП), the registered address, email, phone; the coach may add rows;
- **terms**: heading + paragraph blocks — what the service is (online training programs,
  access to a training plan for a paid period), payment terms (card payment through
  Monobank, the period, auto-renewal and how to cancel), refund terms, contacts for
  disputes; the coach may add blocks.

The real values are not available yet: design with realistic placeholders (a Ukrainian
name, a ten-digit tax id, a Kyiv address) and mark nothing as placeholder on the page
itself — the coach replaces the text in the admin.

## Design tasks

1. **Reading layout.** A legal-ish page that still belongs to the brand: the requisites as a
   scannable definition list the visitor can copy from (tap to copy on the tax id and email
   is welcome), the terms as readable long-form text with anchors per block.
2. **Trust signals** without clutter: where the seller's name and the last-updated date sit,
   how the page relates to the About page (link, not duplication).
3. **Footer entry** on every page: the link's label in both languages and its place in the
   footer, which today has no links at all.
4. **Checkout entry**: the program details dialog gets a one-line reference to the offer
   ("By paying you accept the public offer" with the link) — design the line in both
   languages so the later checkout step can reuse it verbatim.

## Edge cases to design for

320px width with a 40-character label in the requisites; a terms block of 600 words;
the English page when the coach has filled only the Ukrainian terms (falls back to
English, which may be empty too — design the "no terms yet" state, since the page is live
the moment it has a hero).

## Rails

MUI 7 and the project's theme tokens; the site's existing sections (`ContentSection`,
the CTA section) and the typography chosen in the storefront prototype; no new brand
colors; phone-first, desktop inherits; English and Ukrainian microcopy for every label the
page itself owns (headings of the requisites block, the copy affordance, the empty state).

## Deliverable

An interaction spec: the page structure and its three sections, the copy affordances, the
footer and dialog entries, the empty states, bilingual microcopy, and phone + desktop
mockups of `/uk/offer` with placeholder requisites.
