"use client";

import { type ReactElement } from "react";

import { ATHLETE_PROFILE_CONSTANTS } from "@repo/contracts/coaching/athlete-profile";

import {
  BODY_WEIGHT_CAPTION,
  BODY_WEIGHT_EDIT_ACTION_LABEL,
  BODY_WEIGHT_EMPTY_CAPTION,
  BODY_WEIGHT_EMPTY_TITLE,
  BODY_WEIGHT_EYEBROW,
  BODY_WEIGHT_FIELD_LABEL,
  BODY_WEIGHT_SET_ACTION_LABEL,
  BODY_WEIGHT_SET_LABEL,
  KG_LABEL,
  WEIGHT_INPUT_MIN,
  WEIGHT_INPUT_STEP,
  WEIGHT_ROUNDING_FACTOR,
} from "../utils/athlete-profile.constants";

import { BodyStatCard } from "./body-stat-card";

export type BodyWeightCardProps = {
  weightKg: number | null;
  isSaving: boolean;
  onSave: (kg: number) => void;
};

const parseWeight = (draft: string): number | null => {
  const parsed = Number.parseFloat(draft);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  const clamped = Math.min(parsed, ATHLETE_PROFILE_CONSTANTS.MAX_WEIGHT_KG);

  return Math.round(clamped * WEIGHT_ROUNDING_FACTOR) / WEIGHT_ROUNDING_FACTOR;
};

export const BodyWeightCard = ({
  weightKg,
  isSaving,
  onSave,
}: BodyWeightCardProps): ReactElement => (
  <BodyStatCard
    value={weightKg}
    isSaving={isSaving}
    onSave={onSave}
    parseValue={parseWeight}
    eyebrow={BODY_WEIGHT_EYEBROW}
    unit={KG_LABEL}
    caption={BODY_WEIGHT_CAPTION}
    emptyTitle={BODY_WEIGHT_EMPTY_TITLE}
    emptyCaption={BODY_WEIGHT_EMPTY_CAPTION}
    setLabel={BODY_WEIGHT_SET_LABEL}
    editActionLabel={BODY_WEIGHT_EDIT_ACTION_LABEL}
    setActionLabel={BODY_WEIGHT_SET_ACTION_LABEL}
    fieldLabel={BODY_WEIGHT_FIELD_LABEL}
    inputStep={WEIGHT_INPUT_STEP}
    inputMin={WEIGHT_INPUT_MIN}
    inputMax={ATHLETE_PROFILE_CONSTANTS.MAX_WEIGHT_KG}
  />
);
