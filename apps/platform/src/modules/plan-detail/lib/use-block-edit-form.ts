"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";

import {
  defaultSchemeParams,
  schemeArchetypeKindSchema,
  schemeParamsSchema,
} from "@repo/contracts/lms/_domain";
import {
  type CreatePlanBlockRequest,
  type PlanBlock,
  PLAN_BLOCK_CONSTANTS,
  type UpdatePlanBlockRequest,
} from "@repo/contracts/lms/plan-block";
import { type PlanItem, type PlanItemForUpsert } from "@repo/contracts/lms/plan-item";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

const INITIAL_SCHEME_KIND = "NONE" as const;

const blockTypeIdsSchema = z
  .array(z.string().cuid())
  .min(PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES)
  .max(PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "blockTypeIds must be unique",
  });

export const blockFormSchema = z.object({
  order: z.number().int().nonnegative(),
  schemeTypeId: z.string().cuid({ message: "Select a scheme type" }),
  schemeArchetypeKind: schemeArchetypeKindSchema,
  schemeParams: schemeParamsSchema,
  blockTypeIds: blockTypeIdsSchema,
  notes: z.string().max(PLAN_BLOCK_CONSTANTS.MAX_NOTES_LENGTH),
});

export type BlockFormValues = z.infer<typeof blockFormSchema>;

type UseBlockEditFormParams = {
  existingBlock: PlanBlock | null | undefined;
  existingBlocks: readonly PlanBlock[];
  schemeTypes: ReadonlyMap<string, SchemeType>;
  onDirtyChange?: (isDirty: boolean) => void;
};

const buildDefaults = (params: UseBlockEditFormParams): BlockFormValues => {
  const { existingBlock, existingBlocks, schemeTypes } = params;

  if (existingBlock) {
    const archetypeKind =
      schemeTypes.get(existingBlock.schemeTypeId)?.archetypeKind ?? INITIAL_SCHEME_KIND;

    return {
      order: existingBlock.order,
      schemeTypeId: existingBlock.schemeTypeId,
      schemeArchetypeKind: archetypeKind,
      schemeParams: existingBlock.schemeParams,
      blockTypeIds: [...existingBlock.blockTypeIds],
      notes: existingBlock.notes ?? "",
    };
  }

  return {
    order: existingBlocks.length,
    schemeTypeId: "",
    schemeArchetypeKind: INITIAL_SCHEME_KIND,
    schemeParams: defaultSchemeParams(INITIAL_SCHEME_KIND),
    blockTypeIds: [],
    notes: "",
  };
};

const toExistingItemsForUpsert = (items: readonly PlanItem[]): PlanItemForUpsert[] =>
  items.map((item) => ({
    id: item.id,
    order: item.order,
    exerciseId: item.exerciseId,
    prescription: item.prescription,
    ...(item.alternatives !== null ? { alternatives: item.alternatives } : {}),
    ...(item.notes !== null ? { notes: item.notes } : {}),
  }));

export const toCreatePlanBlockRequest = (values: BlockFormValues): CreatePlanBlockRequest => {
  const trimmedNotes = values.notes.trim();

  return {
    order: values.order,
    schemeTypeId: values.schemeTypeId,
    blockTypeIds: values.blockTypeIds,
    ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
    items: [],
  };
};

export const toUpdatePlanBlockRequest = (
  values: BlockFormValues,
  existingItems: readonly PlanItem[],
): UpdatePlanBlockRequest => {
  const trimmedNotes = values.notes.trim();

  return {
    order: values.order,
    schemeTypeId: values.schemeTypeId,
    blockTypeIds: values.blockTypeIds,
    schemeParams: values.schemeParams,
    notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    items: toExistingItemsForUpsert(existingItems),
  };
};

export const useBlockEditForm = (
  params: UseBlockEditFormParams,
): UseFormReturn<BlockFormValues> => {
  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: buildDefaults(params),
  });

  const { isDirty } = form.formState;
  const { onDirtyChange } = params;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return form;
};
