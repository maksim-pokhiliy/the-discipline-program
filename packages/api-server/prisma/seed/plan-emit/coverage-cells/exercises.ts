import { Position, RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const EXERCISE_FORMS: readonly string[] = [
  "atomic",
  "compound",
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

export const EXERCISE_CELLS: readonly CoverageCell[] = [
  ...EXERCISE_FORMS.map(exerciseFormCell),
  ...POSITIONS.map(positionCell),
  ...PLACEHOLDER_KINDS.map(placeholderKindCell),
  ...OR_PURPOSES.map(orPurposeCell),
];
