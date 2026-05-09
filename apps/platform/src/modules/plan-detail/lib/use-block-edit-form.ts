"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";

import {
  defaultSchemeParams,
  type Prescription,
  schemeArchetypeKindSchema,
  schemeParamsSchema,
} from "@repo/contracts/lms/_domain";
import {
  type CreatePlanBlockRequest,
  type PlanBlock,
  PLAN_BLOCK_CONSTANTS,
  type UpdatePlanBlockRequest,
} from "@repo/contracts/lms/plan-block";
import {
  type PlanItem,
  type PlanItemForUpsert,
  planItemForUpsertSchema,
} from "@repo/contracts/lms/plan-item";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

const INITIAL_SCHEME_KIND = "NONE" as const;
const DEFAULT_FIXED_REPS = 10;

export const defaultPrescription = (): Prescription => ({
  reps: { kind: "FIXED", value: DEFAULT_FIXED_REPS },
  sideMode: "BILATERAL",
  modifiers: [],
});

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
  items: z.array(planItemForUpsertSchema),
});

export type BlockFormValues = z.input<typeof blockFormSchema>;

type UseBlockEditFormParams = {
  existingBlock: PlanBlock | null | undefined;
  existingBlocks: readonly PlanBlock[];
  existingItems: readonly PlanItem[];
  schemeTypes: ReadonlyMap<string, SchemeType>;
};

const toFormItems = (items: readonly PlanItem[]): PlanItemForUpsert[] =>
  items.map((item) => ({
    id: item.id,
    order: item.order,
    exerciseId: item.exerciseId,
    prescription: item.prescription,
    ...(item.alternatives !== null ? { alternatives: item.alternatives } : {}),
    ...(item.notes !== null ? { notes: item.notes } : {}),
  }));

const buildDefaults = (params: UseBlockEditFormParams): BlockFormValues => {
  const { existingBlock, existingBlocks, existingItems, schemeTypes } = params;

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
      items: toFormItems(existingItems),
    };
  }

  return {
    order: existingBlocks.length,
    schemeTypeId: "",
    schemeArchetypeKind: INITIAL_SCHEME_KIND,
    schemeParams: defaultSchemeParams(INITIAL_SCHEME_KIND),
    blockTypeIds: [],
    notes: "",
    items: [],
  };
};

const reorderFormItems = (
  items: readonly z.input<typeof planItemForUpsertSchema>[],
): PlanItemForUpsert[] =>
  items.map((item, index) => planItemForUpsertSchema.parse({ ...item, order: index }));

export const toCreatePlanBlockRequest = (values: BlockFormValues): CreatePlanBlockRequest => {
  const trimmedNotes = values.notes.trim();

  return {
    order: values.order,
    schemeTypeId: values.schemeTypeId,
    blockTypeIds: values.blockTypeIds,
    ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
    items: reorderFormItems(values.items),
  };
};

export const toUpdatePlanBlockRequest = (values: BlockFormValues): UpdatePlanBlockRequest => {
  const trimmedNotes = values.notes.trim();

  return {
    order: values.order,
    schemeTypeId: values.schemeTypeId,
    blockTypeIds: values.blockTypeIds,
    schemeParams: values.schemeParams,
    notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    items: reorderFormItems(values.items),
  };
};

export const useBlockEditForm = (
  params: UseBlockEditFormParams,
): UseFormReturn<BlockFormValues> => {
  return useForm({
    resolver: zodResolver(blockFormSchema),
    defaultValues: buildDefaults(params),
  });
};
