# Design round 0.4 — ADMIN: the Languages page (carry SECOND)

## Context

The Discipline Program is a CrossFit coaching product with a public marketing site and an
internal admin console (`apps/admin`, Next.js + MUI 7) where the coach, Denys, edits the
site's content. Repo: `maksim-pokhiliy/the-discipline-program` on `main`. Localization is
part of the CMS: the coach adds languages himself and translates every page in the editor
(a sibling prototype covers that editor). This prototype is the small catalog page where
languages are created and managed.

## The data (fixed)

A language is a row: a **code** (two or three lowercase letters, e.g. `uk`, used in the
site's URLs as `/uk/…` and as the page language), a **name** shown to visitors in the
language switcher (e.g. "Українська"), an **enabled** flag (disabled = hidden from the site,
still editable in the admin) and a **sort order** (the switcher's order). English (`en`) is
the default language: it always exists, cannot be disabled or deleted, and has no URL prefix.
A language that already has translated content cannot be deleted (the server refuses and
says how many sections carry it); a language with no content can.

## Where it lives

Admin navigation, group "Marketing": Products · Reviews · Blog · Pages · Contacts — add
"Languages" there. The admin's catalog pages (see `/labels`, `apps/admin/src/modules/labels/`)
are a `DataTable` list with a create action and a row edit; mirror that density.

## Design tasks

1. **The list.** Code, name, enabled, order, the "default" mark on English, and per language
   a translation progress that answers "how much of the site is in this language" in one
   glance (sections translated vs total; the site has about thirty sections plus products).
2. **Create.** Code + name, with the code rules explained inline (lowercase, 2–3 letters, used
   in links as `/uk/`), a duplicate-code error, and a note that the language is live as soon
   as it is enabled — so the coach may want to create it disabled, translate, then enable.
3. **Enable / disable** and **reorder** in place (a toggle and move up/down or drag; the list
   is short, three languages is already a lot).
4. **Delete.** Allowed only for a language without content; show why when it is refused
   ("Українська has 18 translated sections — remove them first" or disable instead).
5. **Jump to translating.** From a language row, one action takes him to the page editor
   with that language selected.

## Edge cases to design for

Only English exists (the empty state must invite creating the first language without
drama); a disabled language with translations; a language with zero translations; the
default-language row (no toggle, no delete, still reorderable or pinned first — decide).

## Rails

MUI 7 and the project's theme tokens; the existing admin table and form language; no new
color; English UI labels (the console is English, only the content is multilingual);
desktop-first at 1280px, tablet 768px must hold.

## Deliverable

An interaction spec for this page: the list and its columns, the create form, the enable /
disable / reorder / delete interactions with their confirmations and refusals, microcopy,
the empty state, and desktop mockups with English + Ukrainian (enabled) + a third language
(disabled, no content).
