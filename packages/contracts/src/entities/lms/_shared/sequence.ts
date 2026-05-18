import { z } from "zod";

export const SEQUENCE_INDICATOR_KINDS = [
  "before_named",
  "after_named",
  "before_named_after_named_composite",
  "only_once_before",
  "after_each_round",
  "after_each_typed_round",
] as const;

export const sequenceIndicatorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("before_named"), targetLabel: z.string().min(1) }),
  z.object({ kind: z.literal("after_named"), targetLabel: z.string().min(1) }),
  z.object({
    kind: z.literal("before_named_after_named_composite"),
    beforeLabel: z.string().min(1),
    afterLabel: z.string().min(1),
  }),
  z.object({ kind: z.literal("only_once_before"), targetLabel: z.string().min(1) }),
  z.object({ kind: z.literal("after_each_round") }),
  z.object({ kind: z.literal("after_each_typed_round"), type: z.string().min(1) }),
]);

export type SequenceIndicator = z.infer<typeof sequenceIndicatorSchema>;
export type SequenceIndicatorKind = (typeof SEQUENCE_INDICATOR_KINDS)[number];
