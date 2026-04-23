import { z } from "zod";

export const BLOCK_NODE_TYPES = [
  "straightSets",
  "forTime",
  "amrap",
  "emom",
  "everyXMin",
  "intervals",
  "timeBlocks",
  "notes",
  "textCallout",
] as const;

export type BlockNodeType = (typeof BLOCK_NODE_TYPES)[number];

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

const isBlockNodeType = (type: string): type is BlockNodeType =>
  (BLOCK_NODE_TYPES as readonly string[]).includes(type);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z
    .array(tiptapNodeSchema)
    .max(100)
    .refine((nodes) => nodes.every((n) => isBlockNodeType(n.type)), {
      message: "Doc root accepts only block-kind nodes",
    }),
});

export type TiptapDoc = z.infer<typeof tiptapDocSchema>;
