import { z } from "zod";

export const BLOCK_WRAPPER_NODE_TYPE = "block" as const;
export const SECTION_NODE_TYPES = ["schemeSection", "notesSection", "textCalloutSection"] as const;
export const EXERCISE_LINE_NODE_TYPE = "exerciseLine" as const;
export const EMOM_SLOT_NODE_TYPE = "emomSlot" as const;
export const EXERCISE_MENTION_NODE_TYPE = "exerciseMention" as const;
export const PRESCRIPTION_CHIP_NODE_TYPE = "prescriptionChip" as const;

export type BlockWrapperNodeType = typeof BLOCK_WRAPPER_NODE_TYPE;
export type SectionNodeType = (typeof SECTION_NODE_TYPES)[number];

const tiptapAttrsSchema = z.record(z.string(), z.unknown());

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

export const tiptapMarkSchema: z.ZodType<TiptapMark> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    attrs: tiptapAttrsSchema.optional(),
  }),
);

export const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    attrs: tiptapAttrsSchema.optional(),
    content: z.array(tiptapNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(tiptapMarkSchema).optional(),
  }),
);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z
    .array(tiptapNodeSchema)
    .max(100)
    .refine((nodes) => nodes.every((n) => n.type === BLOCK_WRAPPER_NODE_TYPE), {
      message: "Doc root accepts only block wrapper nodes",
    }),
});

export type TiptapDoc = z.infer<typeof tiptapDocSchema>;
