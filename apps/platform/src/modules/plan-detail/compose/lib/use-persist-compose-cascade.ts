"use client";

import { useCallback } from "react";

import { useCreateSchema, useCreateSchemaRow } from "@app/lib/hooks";

import type { CreateSchemaPlanNode } from "./compose-to-create-requests";

export type PersistResult = { ok: true } | { ok: false; createdCount: number; error: Error };

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error("compose cascade failed");

export const usePersistComposeCascade = (
  planId: string,
  startDate: string,
): {
  persist: (nodes: CreateSchemaPlanNode[], blockId: string) => Promise<PersistResult>;
  isPending: boolean;
} => {
  const createSchema = useCreateSchema(planId, startDate);
  const createSchemaRow = useCreateSchemaRow(planId, startDate);

  const persist = useCallback(
    async (nodes: CreateSchemaPlanNode[], blockId: string): Promise<PersistResult> => {
      let createdCount = 0;

      const persistNode = async (
        node: CreateSchemaPlanNode,
        parentSchemaId: string | null,
      ): Promise<void> => {
        const created = await createSchema.mutateAsync({
          blockId,
          ...(parentSchemaId !== null && { parentSchemaId }),
          ...node.schema,
        });

        createdCount += 1;

        for (const row of node.rows) {
          await createSchemaRow.mutateAsync({ schemaId: created.id, ...row });
          createdCount += 1;
        }

        for (const child of node.children) {
          await persistNode(child, created.id);
        }
      };

      try {
        for (const node of nodes) {
          await persistNode(node, null);
        }
      } catch (cause) {
        return { ok: false, createdCount, error: toError(cause) };
      }

      return { ok: true };
    },
    [createSchema, createSchemaRow],
  );

  return { persist, isPending: createSchema.isPending || createSchemaRow.isPending };
};
