import { type z } from "zod";

import { type BlockStatus } from "@repo/contracts/lms/_domain";
import { type Block } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";

import { type EditSessionStatus } from "../../edit-session";

export type BlockBuilderErrors = z.ZodError | null;

export type BlockBuilderProps = {
  block: Block;
  blockKinds?: BlockKind[];
  onChange: (next: Block | ((prev: Block) => Block)) => void;
  errors?: BlockBuilderErrors;
  status?: EditSessionStatus;
  disabled?: boolean;
};

export type BlockStatusOption = {
  value: BlockStatus;
  label: string;
};
