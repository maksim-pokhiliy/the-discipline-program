import { Position, RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const EXERCISE_FORMS: readonly string[] = [
  "atomic",
  "compound",
  "cyclical",
  "sandwich",
  "or_alternative",
  "placeholder_ref",
];

const exerciseFormCell = (form: string): CoverageCell => ({
  id: `exerciseForm.${form}`,
  category: "exerciseForm",
  label: `Exercise.form = ${form}`,
  required: 1,
  sourceRef: `coverage-matrix §5 ${form}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.EXERCISE,
      rowPayload: { path: ["exercise", "form"], equals: form },
    }),
});

const POSITIONS: readonly Position[] = [
  Position.NEUTRAL_GRIP,
  Position.FROM_SOFA,
  Position.FROM_BOX,
  Position.FROM_BOX_OR_SOFA,
  Position.FROM_SOFA_BOX,
  Position.WITHOUT_BENCH,
  Position.WITHOUT_JUMP,
  Position.HOLD_FARM_CARRY,
  Position.HAND_ON_DB,
  Position.HANDS_ON_DB,
  Position.HAND_ON_DB_NEUTRAL_GRIP,
];

const positionCell = (position: Position): CoverageCell => ({
  id: `position.${position}`,
  category: "position",
  label: `Position = ${position}`,
  required: 1,
  sourceRef: `coverage-matrix §16 ${position}`,
  tally: (db, planId) => countSchemaRow(db, planId, { position }),
});

const PLACEHOLDER_KINDS: readonly string[] = [
  "muscle_group_reference",
  "purpose_category",
  "coach_choice_slot",
];

const placeholderKindCell = (kind: string): CoverageCell => ({
  id: `perSetSubstitution.placeholder.${kind}`,
  category: "perSetSubstitution",
  label: `PlaceholderKind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §20 ${kind}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.PLACEHOLDER,
      rowPayload: { path: ["placeholder", "placeholderKind"], equals: kind },
    }),
});

const OR_PURPOSES: readonly string[] = ["scale_down", "equipment_substitute", "coach_choice"];

const orPurposeCell = (purpose: string): CoverageCell => ({
  id: `compoundForm.orAlternative.${purpose}`,
  category: "compoundForm",
  label: `OrAlternative.purpose = ${purpose}`,
  required: 1,
  sourceRef: `coverage-matrix §21 ${purpose}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.EXERCISE,
      rowPayload: { path: ["exercise", "orAlternative", "purpose"], equals: purpose },
    }),
});

const COMPOUND_REP_FORMS: readonly string[] = ["inline_equality", "curly_brace"];

const compoundRepFormCell = (form: string): CoverageCell => ({
  id: `compoundRepDefinition.${form}`,
  category: "compoundRepDefinition.form",
  label: `CompoundRepDefinition.form = ${form}`,
  required: 1,
  sourceRef: `coverage-matrix §22 ${form}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, { compoundRep: { path: ["form"], equals: form } }),
});

const FOOTNOTE_MARKERS: readonly string[] = ["*", "**"];
const FOOTNOTE_TARGETS: readonly string[] = ["each_round", "each_set", "each_typed_round"];

const footnoteMarkerCell = (marker: string): CoverageCell => ({
  id: `footnote.marker.${marker}`,
  category: "footnote",
  label: `Footnote.marker = ${marker}`,
  required: 1,
  sourceRef: `coverage-matrix §23 marker ${marker}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.FOOTNOTE,
      rowPayload: { path: ["marker"], equals: marker },
    }),
});

const footnoteTargetCell = (target: string): CoverageCell => ({
  id: `footnote.target.${target}`,
  category: "footnote",
  label: `Footnote.target = ${target}`,
  required: 1,
  sourceRef: `coverage-matrix §23 target ${target}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.FOOTNOTE,
      rowPayload: { path: ["target"], equals: target },
    }),
});

export const EXERCISE_CELLS: readonly CoverageCell[] = [
  ...EXERCISE_FORMS.map(exerciseFormCell),
  ...POSITIONS.map(positionCell),
  ...PLACEHOLDER_KINDS.map(placeholderKindCell),
  ...OR_PURPOSES.map(orPurposeCell),
  ...COMPOUND_REP_FORMS.map(compoundRepFormCell),
  ...FOOTNOTE_MARKERS.map(footnoteMarkerCell),
  ...FOOTNOTE_TARGETS.map(footnoteTargetCell),
];
