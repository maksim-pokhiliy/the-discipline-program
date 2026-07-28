# Design round — TRAINING DAY page: level provenance on resolved weights + in-place control

## Context

The Discipline Program is a CrossFit coaching platform. Coaches author weekly plans; athletes open a phone-first training day screen: movements, reps, working weights. Two domain features matter here:

- **Levels.** A weight can be authored as a per-profile grid (e.g. RX/Scaled × Male/Female). The athlete picks their coordinates once, and every such row resolves to a single number ("24 kg"). Coordinates can be re-picked at any time; axis value names are free-form text up to 100 characters, and a grid can have up to two axes — so a full provenance reads like "RX · Female".
- **1RM records.** Rows authored as "% of your 1RM" resolve against the athlete's own record history for that movement; the LATEST record wins. An athlete with no logged max sees an inline prompt to enter one, right on the row.

## Problem 1 — a resolved weight is a bare, silent number

Nothing on this screen names the level that produced the number, nothing marks the moment a level switch applies, and there is no way to switch the level without leaving for the profile page. Rows collected into groups (supersets and similar) are worse: they never render a level picker at all, not even for the first pick.

Real incident: an athlete switched herself from Scaled to RX on her profile page. The system recalculated everything, including the number on this screen — and she still wrote to the coach "your program doesn't want me to be RX". The update was silent: a bare number quietly became a different bare number.

Design task: every resolved weight names its level; the athlete can switch the level in place; the switch has an unmistakable "applied" moment; grouped rows get exactly the same affordances as plain rows.

Input sketch (a starting point, not the answer): a provenance label right next to the number ("24 kg · RX"); the label itself is the control that re-opens the picker.

## Problem 2 — a 1RM entered once can never be fixed here

After the athlete enters a max on a "% of your 1RM" row, the row resolves and the entry prompt is gone for good — a typo is uncorrectable from this screen.

Design task: an always-available "fix my max" control on a resolved percentage row that re-opens the entry. Mechanics are fixed and not up for redesign: a correction appends a new record, the latest record wins, so after saving the row's number updates in place. (Full history management — editing and deleting past records — lives on the Records page and is covered by a separate prototype; this screen only needs the entry/correction affordance.)

## Shared language (this round spans three page prototypes)

This page, the Profile page, and the Records page are being designed in parallel prototypes. The unifying mechanism across all three: **a live provenance label on a resolved weight that opens control** — switch the level, or correct the max. Whatever visual form the label-as-control takes here becomes the reference for the other two pages, so make it distinctive and repeatable (one pattern for "this number has a source; tap to manage it").

## Edge cases to design for

320px width; a 100-character axis value inside the label; two-axis provenance ("RX · Female"); rows inside a group where horizontal space is already contested; a row that is both grouped AND percentage-based.

## Rails

- Phone-first: 320–430px is the primary viewport; desktop inherits.
- Stay inside the existing app language (MUI-based design system, existing palette and typography); no rebranding.
- Do not redesign the profile grid or the level model — this round is about perception and control, not data modeling.
- The plan text published to the athletes' legacy mobile app is entirely out of scope.

## Deliverable

An interaction spec for this page: components and their states, microcopy, the flows (open → pick → applied; enter/correct a max), the edge cases above, and phone-width mockups.
