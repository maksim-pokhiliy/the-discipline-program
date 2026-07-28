# Design round — RECORDS page: 1RM history the athlete can keep clean

## Context

The Discipline Program is a CrossFit coaching platform. Athletes own their 1RM record history per movement: entries append over time (from this page and from inline prompts on training rows), and training rows authored as "% of your 1RM" resolve against it. The resolution law is fixed: **the LATEST record wins** — it defines the athlete's current working weight for that movement.

## Problem — a mistyped record sits in the history forever

The history is append-only today. If an athlete mistypes a max (250 instead of 25), the only remedy is appending a corrected record — the garbage entry stays in the list permanently, polluting the history and any chart built on it. Athletes reported this directly.

## What is newly granted (the shape is yours to design)

The athlete gets history-hygiene operations on his OWN records. Recommended set: **edit + delete**. A third candidate — "exclude from stats" — is on the table, but we believe it is indistinguishable from delete in this product; include it only if you find a scenario where the distinction earns its place.

Mechanics that are fixed and not up for redesign: a NEW max is always an appended record; the latest record wins; records belong to the athlete (no coach approval flows).

## The consequence the design MUST surface, not hide

Because the latest record wins:

- editing or deleting the LATEST record retroactively changes the athlete's current working weight on the training screen;
- deleting a movement's LAST remaining record returns its "% of 1RM" training rows to the "enter your max" prompt.

Destructive operations deserve a confirmation that states this plainly ("this changes your current working weight" — in your words). Editing a non-latest record is history-only and needs no such warning.

Design task: where the edit/delete controls live on a history list optimized for a phone; the edit flow (value, date?); the delete confirmation with the consequence spelled out; what the list looks like mid-edit and after; the empty state after the last record is deleted.

## Shared language (this round spans three page prototypes)

This page, the Training Day page, and the Profile page are being designed in parallel prototypes. The unifying mechanism: a resolved weight always names its source, and that label opens control. On the training screen the athlete corrects a max via an inline "fix my max" control (append semantics); this page is where the full history is managed. The two must feel like one system: same terminology for the max, same value formatting, and the "latest wins" rule visible in both.

## Edge cases to design for

320px width; a long movement name next to controls; a one-entry history (delete = empty state); many entries for one movement (does the LATEST need a visual marker, given it drives the working weight? — we think yes); an entry created seconds ago by a typo (the prime scenario).

## Rails

- Phone-first: 320–430px is the primary viewport; desktop inherits.
- Stay inside the existing app language (MUI-based design system, existing palette and typography); no rebranding.
- Records grouping/organization of the page beyond the history operations is out of scope — design the operations into the existing list, not a new page.

## Deliverable

An interaction spec for this page: the history-item operations and their states, microcopy, the edit and delete flows with confirmations, the edge cases above, and phone-width mockups.
