"use client";

import { useContext } from "react";

import {
  LabelOptionsContext,
  type LabelOptionsLevel,
  type LabelOptionsValue,
} from "@app/lib/contexts";

export const useLabelOptions = (level: LabelOptionsLevel): LabelOptionsValue => {
  const ctx = useContext(LabelOptionsContext);

  if (ctx === null) {
    throw new Error("useLabelOptions must be used within LabelOptionsProvider");
  }

  return ctx[level];
};
