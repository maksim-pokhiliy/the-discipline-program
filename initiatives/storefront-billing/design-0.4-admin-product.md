# UI spec 0.4e — ADMIN: the product form with translations and a photo

> Owner ruling 2026-10-16: admin screens are not carried to Claude Design. The admin has no design of its own, so the planner specs them from the existing admin patterns, and this brief is the spec the 0.4e prompt is written from (D-22 amendment).

## Context

The Discipline Program is a CrossFit coaching product with a public marketing site and an
internal admin console (`apps/admin`, Next.js + MUI 7) where the coach, Denys, manages the
training programs he sells (products) and the site's content. Repo:
`maksim-pokhiliy/the-discipline-program` on `main`; the product form lives in
`apps/admin/src/modules/products/components/product-form.tsx` and its edit view in
`apps/admin/src/modules/products/views/product-edit-view/`.

Localization is part of the CMS (sibling prototypes cover the page editor and the Languages
page). Products are the part of the site a buyer reads most carefully, and the acquiring
provider's checklist says every product must have a photo, a description and a price. This
prototype adds two things to the product form: **translations** of the product's text and a
**photo**.

## The form today (keep what works)

A two-column layout: left, a "Basic Information" card (product title, description) and a
"Features List" card (a tags input: short bullet points shown on the marketing card); right,
a "Visibility" card (active / featured checkboxes), a slug field and a "Pricing" card
(amount, currency, period, auto-renew). Save in the header. Prices and visibility are
not translated and not part of this round.

## The data (fixed)

- The base fields (title, description, features) are the English text.
- A translation is one row per language: title, description, features (the same shape),
  created only for the languages that exist on the Languages page. A missing translation
  falls back to English on the site, so a product without a Ukrainian translation is a normal
  state.
- The photo is one image per product (uploaded through the admin's existing image upload,
  the same control the page hero backgrounds use), shown on the storefront card and in the
  product details dialog. Optional at the data level; the acquiring checklist wants it
  present, so the form should make its absence visible.

## Design tasks

1. **Translations in the form.** Where the per-language title, description and features live
   relative to the English fields, how the coach switches language, and the read-only English
   reference beside the translated inputs (the same convention the page editor prototype
   establishes — if that prototype is already done, follow it). A language with no
   translation yet must be one step from "start translating".
2. **The photo.** Upload, preview, replace and remove, with the aspect ratio the storefront
   card will use (decide it: the card is a vertical card with the title and price on a tinted
   header; the photo sits above or behind that header — propose and justify). An empty photo
   state that nudges without blocking.
3. **Saving.** Translations and the photo save with the product (one Save), or on their own —
   decide, and make the dirty state per language legible.
4. **The list page.** Products list (`products-list-section`) gains a photo thumbnail and a
   compact "translated into: UK" mark per row; keep the existing columns.

## Edge cases to design for

A product with four features and 400 characters of description in two languages side by
side at 1280px; only English exists (no translation UI at all — or an invitation to add a
language?); a translation whose English changed later; an upload error; a photo of the wrong
aspect ratio.

## Rails

MUI 7 and the project's theme tokens; the existing admin form language (`FormCard`,
`TextField`, `TagsInput`, the image upload control used by page heroes); no new color;
English UI labels; desktop-first at 1280px, tablet 768px must hold.

## Deliverable

An interaction spec: the translation block and its language switching, the reference
presentation, the photo block (states, aspect ratio, errors), save semantics, microcopy, and
desktop mockups of the edit form with English + Ukrainian and a photo, plus the list row.
