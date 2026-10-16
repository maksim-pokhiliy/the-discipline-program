# Design round 0.4 — ADMIN: the page editor with languages (carry FIRST)

## Context

The Discipline Program is a CrossFit coaching product: a public marketing site
(`apps/marketing`, Next.js + MUI 7) and an internal admin console (`apps/admin`, same stack)
where the coach, Denys, edits the site's content himself. Repo: `maksim-pokhiliy/the-discipline-program`
on `main`; the admin pages editor lives in `apps/admin/src/modules/pages/`, its section forms in
`apps/admin/src/modules/pages/components/sections/`.

The site needs a Ukrainian version before the coach can apply for card acquiring, and the
decision is that **localization is part of the CMS**: the coach adds a language in the admin and
translates every page there. Nothing he reads is a code file. This prototype is the screen he
will spend the most time on, so it is designed first; a sibling prototype covers the small
"Languages" catalog page.

## How the editor works today (keep what works)

Admin → Pages → a page (Home, Storefront, About, Blog, Contact, FAQ) opens an edit view: a
header ("Edit Marketing Page", the page name, "Back to Pages") and a vertical stack of
accordions, one per section of the page (Hero, Why Choose Us, Reviews, Contact …). Each
accordion holds a form of plain text fields (title, subtitle, button text, button link, an
image upload for the hero background) or a list editor (FAQ items, timeline items, feature
cards) and an "Update Section" button, enabled when the form is dirty. The accordion that is
open is remembered in the URL.

## What changes with languages (the data model is fixed)

- Every section exists once per language. English is the default language and always
  exists; other languages are rows the coach adds on the Languages page (e.g. `uk`,
  "Українська"). A language can be disabled (hidden from the site, still editable).
- A section the coach has not translated yet is simply empty in that language; on the site it
  falls back to English automatically. So a half-translated page is a normal state, not an
  error.
- New sections arrive with this round and must fit the same editor: an **SEO** section on
  every page (page title + description for search engines), a **Site** pseudo-page holding
  the strings shared by every page (navigation labels, footer tagline and copyright line, the
  lead form's labels and messages, the 404 / error page texts), and an **Offer** page
  (hero; a list of requisites as label + value rows: full name of the sole proprietor, tax
  id, address, email, phone; and terms as heading + paragraph blocks: service description,
  payment terms, refund terms).

## Design tasks

1. **Language switching inside the editor.** The coach picks which language he is editing.
   Make the current language unmistakable on the whole screen (he must never save a
   Ukrainian text into the English page by mistake). Show, per language, how much of this
   page is translated (sections filled vs empty) without turning it into a dashboard.
2. **Reference while translating.** When he edits a non-default language, every field shows
   the English value next to or above the input, read-only, so he never flips languages to
   remember what the original said. Decide how this reads in a list editor (FAQ items: the
   English question/answer pairs beside the Ukrainian ones) and in a long text area.
3. **Empty vs translated vs stale.** A section that has no translation yet; a section whose
   translation exists; and a section whose English changed after the translation was made
   (the data has `updatedAt` per row, so "English is newer than this translation" is
   knowable). Make the three states readable at the accordion level before opening one.
4. **The new section forms** inside the same accordion language: SEO (two fields with
   length hints), Site (grouped fields: navigation, footer, lead form, error pages) and
   Offer (requisites as label + value rows the coach can add, reorder and remove; terms as
   heading + paragraph blocks, same operations).
5. **Save semantics.** Each section saves on its own, as today. Make the saved state and
   the "English is newer" state coexist with the dirty state without three competing badges.

## Edge cases to design for

A page with twenty sections; a language with zero translations; the default language
(English) selected — no reference column, the plain editor; a disabled language (editable,
marked as not live); a 100-character section title in the reference; the screen at 1280px
and at a 768px tablet width (the coach sometimes edits from an iPad).

## Rails

- Stay inside the existing admin language: MUI 7, the project's theme tokens, the existing
  accordion-per-section editor, `FormCard`, `TextField`, `DataTable`. No rebranding, no new
  color.
- Do not redesign the content model: sections, their fields and the per-language rows are
  fixed. The prototype decides how they are presented and operated.
- English UI labels in the admin (the console is English; only the content is multilingual).
- Desktop-first (1280px), tablet (768px) must hold.

## Deliverable

An interaction spec for this screen: the language selector and its states, the reference
presentation inside a text field, a text area and a list editor, the accordion-level state
marks, the SEO / Site / Offer forms, microcopy for every label, hint and empty state, and
desktop mockups of the Storefront page editor in Ukrainian with two sections translated and
one stale, plus the Offer page editor.
