"use client";

import { useMemo } from "react";

import { useQueries } from "@tanstack/react-query";

import { type EffectivePlanWeek } from "@repo/contracts/lms/plan-override";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import { type EffectiveNodeDecoration } from "./get-decoration-styles";

export type EffectivePlanDecorationApi = {
  getDecoration: (id: string) => EffectiveNodeDecoration | null;
};

const NULL_API: EffectivePlanDecorationApi = {
  getDecoration: () => null,
};

const flattenWeek = (week: EffectivePlanWeek, acc: Map<string, EffectiveNodeDecoration>): void => {
  acc.set(week.id, {
    isOverridden: week.isOverridden,
    overrideKind: week.overrideKind,
    notes: week.notes,
    suspended: week.suspended,
  });

  for (const day of week.days) {
    acc.set(day.id, {
      isOverridden: day.isOverridden,
      overrideKind: day.overrideKind,
      notes: day.notes,
      suspended: day.suspended,
    });

    for (const session of day.sessions) {
      acc.set(session.id, {
        isOverridden: session.isOverridden,
        overrideKind: session.overrideKind,
        notes: session.notes,
        suspended: session.suspended,
      });

      for (const block of session.blocks) {
        acc.set(block.id, {
          isOverridden: block.isOverridden,
          overrideKind: block.overrideKind,
          notes: block.notes,
          suspended: block.suspended,
        });

        for (const segment of block.segments) {
          acc.set(segment.id, {
            isOverridden: segment.isOverridden,
            overrideKind: segment.overrideKind,
            notes: segment.notes,
            suspended: segment.suspended,
          });

          for (const entry of segment.entries) {
            acc.set(entry.id, {
              isOverridden: entry.isOverridden,
              overrideKind: entry.overrideKind,
              notes: entry.notes,
              suspended: entry.suspended,
            });
          }
        }
      }
    }
  }
};

export type UseEffectivePlanDecorationParams = {
  enrollmentId: string | null;
  fromWeek: number;
  toWeek: number;
};

export const useEffectivePlanDecoration = ({
  enrollmentId,
  fromWeek,
  toWeek,
}: UseEffectivePlanDecorationParams): EffectivePlanDecorationApi => {
  const weekIndices = useMemo(() => {
    if (!enrollmentId) {
      return [] as number[];
    }

    if (!Number.isInteger(fromWeek) || !Number.isInteger(toWeek) || fromWeek > toWeek) {
      return [] as number[];
    }

    const out: number[] = [];

    for (let i = fromWeek; i <= toWeek; i++) {
      out.push(i);
    }

    return out;
  }, [enrollmentId, fromWeek, toWeek]);

  const queries = useQueries({
    queries: weekIndices.map((weekIndex) => ({
      queryKey: enrollmentId
        ? platformKeys.planOverrides.effectivePlan(enrollmentId, weekIndex)
        : (["plan-overrides", "effective-plan", "disabled", weekIndex] as const),
      queryFn: () => {
        if (!enrollmentId) {
          return Promise.reject(new Error("Effective plan requires enrollmentId"));
        }

        return api.planOverrides.getEffectivePlan(enrollmentId, weekIndex);
      },
      enabled: !!enrollmentId,
      staleTime: 30_000,
    })),
  });

  return useMemo<EffectivePlanDecorationApi>(() => {
    if (!enrollmentId) {
      return NULL_API;
    }

    const map = new Map<string, EffectiveNodeDecoration>();

    for (const query of queries) {
      if (query.data) {
        flattenWeek(query.data, map);
      }
    }

    return {
      getDecoration: (id) => map.get(id) ?? null,
    };
  }, [enrollmentId, queries]);
};
