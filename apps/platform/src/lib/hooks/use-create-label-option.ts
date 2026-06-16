"use client";

import { useCallback } from "react";

import type { AppLevelValue } from "@repo/contracts/lms/label";
import type { CreatableOption } from "@repo/ui";

import { useCreateLabel } from "./use-create-label";

export const useCreateLabelOption = (
  level: AppLevelValue,
): ((typedName: string) => Promise<CreatableOption | null>) => {
  const createLabel = useCreateLabel();

  return useCallback(
    (typedName: string) =>
      createLabel
        .mutateAsync({ name: typedName, applicableLevels: [level], rest: false })
        .then((label): CreatableOption => ({ id: label.id, label: label.name }))
        .catch(() => null),
    [createLabel, level],
  );
};
