import { type ChangeEvent, type KeyboardEvent, type RefCallback } from "react";

import { type z } from "zod";

import { type BlockStatus } from "@repo/contracts/lms/_domain";
import { type Block } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";

import { type EditSessionStatus } from "../../edit-session";

export type BlockBuilderErrors = z.ZodError | null;

export type BlockBuilderNotesSlotProps = {
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  onChange?: ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined;
  onBlur?: (() => void) | undefined;
  inputRef?: RefCallback<HTMLInputElement | HTMLTextAreaElement> | undefined;
};

export type BlockBuilderProps = {
  block: Block;
  blockKinds?: BlockKind[] | undefined;
  onChange: (next: Block | ((prev: Block) => Block)) => void;
  errors?: BlockBuilderErrors | undefined;
  status?: EditSessionStatus | undefined;
  disabled?: boolean | undefined;
  notesSlotProps?: BlockBuilderNotesSlotProps | undefined;
};

export type BlockStatusOption = {
  value: BlockStatus;
  label: string;
};
