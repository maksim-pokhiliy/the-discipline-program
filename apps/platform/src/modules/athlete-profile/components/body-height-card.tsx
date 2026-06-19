"use client";

import { type ReactElement } from "react";

import { ATHLETE_PROFILE_CONSTANTS } from "@repo/contracts/coaching/athlete-profile";

import {
  BODY_HEIGHT_CAPTION,
  BODY_HEIGHT_EDIT_ACTION_LABEL,
  BODY_HEIGHT_EMPTY_CAPTION,
  BODY_HEIGHT_EMPTY_TITLE,
  BODY_HEIGHT_EYEBROW,
  BODY_HEIGHT_SET_ACTION_LABEL,
  BODY_HEIGHT_SET_LABEL,
  HEIGHT_FIELD_LABEL,
  HEIGHT_INPUT_MIN,
  HEIGHT_INPUT_STEP,
  HEIGHT_UNIT_LABEL,
} from "../utils/athlete-profile.constants";

import { BodyStatCard } from "./body-stat-card";

export type BodyHeightCardProps = {
  heightCm: number | null;
  isSaving: boolean;
  onSave: (cm: number) => void;
};

const parseHeight = (draft: string): number | null => {
  const parsed = Number.parseInt(draft, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, ATHLETE_PROFILE_CONSTANTS.MAX_HEIGHT_CM);
};

export const BodyHeightCard = ({
  heightCm,
  isSaving,
  onSave,
}: BodyHeightCardProps): ReactElement => (
  <BodyStatCard
    value={heightCm}
    isSaving={isSaving}
    onSave={onSave}
    parseValue={parseHeight}
    eyebrow={BODY_HEIGHT_EYEBROW}
    unit={HEIGHT_UNIT_LABEL}
    caption={BODY_HEIGHT_CAPTION}
    emptyTitle={BODY_HEIGHT_EMPTY_TITLE}
    emptyCaption={BODY_HEIGHT_EMPTY_CAPTION}
    setLabel={BODY_HEIGHT_SET_LABEL}
    editActionLabel={BODY_HEIGHT_EDIT_ACTION_LABEL}
    setActionLabel={BODY_HEIGHT_SET_ACTION_LABEL}
    fieldLabel={HEIGHT_FIELD_LABEL}
    inputStep={HEIGHT_INPUT_STEP}
    inputMin={HEIGHT_INPUT_MIN}
    inputMax={ATHLETE_PROFILE_CONSTANTS.MAX_HEIGHT_CM}
  />
);
