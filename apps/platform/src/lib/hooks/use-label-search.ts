"use client";

import { useQuery } from "@tanstack/react-query";

import type { AppLevelValue, Label, LabelSearchParams } from "@repo/contracts/lms/label";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type UseLabelSearchArgs = {
  level?: AppLevelValue;
  q?: string;
  enabled?: boolean;
};

export const useLabelSearch = ({ level, q, enabled = true }: UseLabelSearchArgs = {}) =>
  useQuery<Label[]>({
    queryKey: platformKeys.labels.search(level, q),
    queryFn: () => {
      const params: LabelSearchParams = {
        ...(level !== undefined && { level }),
        ...(q !== undefined && { q }),
      };

      return api.labels.search(Object.keys(params).length > 0 ? params : undefined);
    },
    enabled,
  });
