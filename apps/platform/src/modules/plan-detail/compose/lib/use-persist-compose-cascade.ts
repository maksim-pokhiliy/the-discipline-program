"use client";

import { useCallback } from "react";

import { useCreateSchema, useCreateSchemaRow, useUpdateSchema } from "@app/lib/hooks";

import { resolveArrangement } from "../../lib/arrangement-resolve";
import type { NodeId } from "../compose-tree.types";

import type { CreateSchemaPlanNode } from "./compose-to-create-requests";

export type PersistResult = { ok: true } | { ok: false; createdCount: number; error: Error };

type RefMap = Map<NodeId, string>;

type UpdateSchema = ReturnType<typeof useUpdateSchema>;

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error("compose cascade failed");

const collectDeferredNodes = (nodes: CreateSchemaPlanNode[]): CreateSchemaPlanNode[] => {
  const deferred: CreateSchemaPlanNode[] = [];

  const walk = (node: CreateSchemaPlanNode): void => {
    if (node.deferredArrangement !== undefined) {
      deferred.push(node);
    }

    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return deferred;
};

const wireArrangements = async (
  nodes: CreateSchemaPlanNode[],
  refMap: RefMap,
  updateSchema: UpdateSchema,
): Promise<void> => {
  for (const node of collectDeferredNodes(nodes)) {
    if (node.deferredArrangement === undefined) {
      continue;
    }

    const schemaId = refMap.get(node.draftNodeId);
    const resolved = resolveArrangement(node.deferredArrangement, refMap);

    if (schemaId === undefined || !resolved.ok) {
      throw new Error("could not resolve arrangement references after persist");
    }

    await updateSchema.mutateAsync({
      schemaId,
      data: { composition: { ...node.schema.composition, arrangement: resolved.arrangement } },
    });
  }
};

export const usePersistComposeCascade = (
  planId: string,
  startDate: string,
): {
  persist: (nodes: CreateSchemaPlanNode[], blockId: string) => Promise<PersistResult>;
  isPending: boolean;
} => {
  const createSchema = useCreateSchema(planId, startDate);
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);

  const persist = useCallback(
    async (nodes: CreateSchemaPlanNode[], blockId: string): Promise<PersistResult> => {
      let createdCount = 0;
      const refMap: RefMap = new Map();

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
        refMap.set(node.draftNodeId, created.id);

        for (const { draftNodeId, row } of node.rows) {
          const createdRow = await createSchemaRow.mutateAsync({ schemaId: created.id, ...row });

          createdCount += 1;
          refMap.set(draftNodeId, createdRow.id);
        }

        for (const child of node.children) {
          await persistNode(child, created.id);
        }
      };

      try {
        for (const node of nodes) {
          await persistNode(node, null);
        }

        await wireArrangements(nodes, refMap, updateSchema);
      } catch (cause) {
        return { ok: false, createdCount, error: toError(cause) };
      }

      return { ok: true };
    },
    [createSchema, createSchemaRow, updateSchema],
  );

  return {
    persist,
    isPending: createSchema.isPending || createSchemaRow.isPending || updateSchema.isPending,
  };
};
