# Design round — PROFILE page: a level switch that reads as a switch

## Context

The Discipline Program is a CrossFit coaching platform. Athletes have a training level expressed as coordinates on a per-profile grid (e.g. RX/Scaled × Male/Female); every per-profile weight in their training resolves through these coordinates. The profile page is where the athlete picks and re-picks them. Axis value names are free-form text up to 100 characters; a grid has up to two axes.

## Problem — the switch that didn't read as a switch

The level choice is currently a row of plain buttons; the only "selected" signal is the chosen button turning filled. Real incident: an athlete switched herself from Scaled to RX here. The system honestly recalculated everything, including the weights on her training screen — and she still did not understand that anything had happened, and wrote to the coach "your program doesn't want me to be RX". A button semantically promises an action; it does not show a selection state, and there was no explicit "applied" moment.

Design task: pick the right selection primitive for "choose one of N" (toggle group, selectable chips, radio — your call) and give the choice an explicit applied-feedback moment. The feedback should make clear the change is already in effect everywhere — her training weights included — not a draft awaiting a save.

## Shared language (this round spans three page prototypes)

This page, the Training Day page, and the Records page are being designed in parallel prototypes. The unifying idea: the athlete's level is one mental model with two venues — picked here, and switchable in place on the training screen next to the resolved weight ("24 kg · RX", where the label opens the picker). The selection state you design here and the in-session picker must read as the same control in two homes: same value names, same selected-state treatment, same applied moment.

## Edge cases to design for

320px width; a 100-character axis value as an option label; two axes on one page (two selection groups that must not blur together); the moment of switching while the previous choice is still visibly active.

## Rails

- Phone-first: 320–430px is the primary viewport; desktop inherits.
- Stay inside the existing app language (MUI-based design system, existing palette and typography); no rebranding.
- Do not redesign the profile grid or the level model — the set of axes and values exists as-is; this round is about the selection control and its feedback.

## Deliverable

An interaction spec for this page: the selection component and its states, microcopy, the applied-feedback flow, the edge cases above, and phone-width mockups.
