"use client";

import { useCallback } from "react";

import { useUpdateSchema } from "@app/lib/hooks";

import type { SchemaCompositionUpdate } from "./diff-compose-axes";

export type EditPersistResult = { ok: true } | { ok: false; error: Error };

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error("compose edit failed");

export const useEditComposeAxes = (
  planId: string,
  startDate: string,
): {
  saveEdits: (updates: SchemaCompositionUpdate[]) => Promise<EditPersistResult>;
  isPending: boolean;
} => {
  const updateSchema = useUpdateSchema(planId, startDate);

  const saveEdits = useCallback(
    async (updates: SchemaCompositionUpdate[]): Promise<EditPersistResult> => {
      try {
        for (const { schemaId, composition } of updates) {
          await updateSchema.mutateAsync({ schemaId, data: { composition } });
        }
      } catch (cause) {
        return { ok: false, error: toError(cause) };
      }

      return { ok: true };
    },
    [updateSchema],
  );

  return { saveEdits, isPending: updateSchema.isPending };
};
