"use client";

import { type ReactElement } from "react";

import { TagChip } from "../tag-chip";

export type BlockLabelProps = {
  text: string;
  filled?: boolean | undefined;
  onDelete?: (() => void) | undefined;
};

export const BlockLabel = ({ text, filled, onDelete }: BlockLabelProps): ReactElement => (
  <TagChip
    label={text}
    filled={filled}
    sx={{ textTransform: "uppercase" }}
    {...(onDelete !== undefined && { onDelete })}
  />
);
