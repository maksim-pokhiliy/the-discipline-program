import { type ChangeEvent, type KeyboardEvent, type RefCallback } from "react";

import { type z } from "zod";

import { type BlockSegment } from "@repo/contracts/lms/block-segment";

import { type EditSessionStatus } from "../../edit-session";

export type BlockSegmentEditorErrors = z.ZodError | null;

export type BlockSegmentEditorLabelSlotProps = {
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  onChange?: ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined;
  onBlur?: (() => void) | undefined;
  inputRef?: RefCallback<HTMLInputElement | HTMLTextAreaElement> | undefined;
};

export type BlockSegmentEditorProps = {
  segment: BlockSegment;
  onChange: (next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void;
  errors?: BlockSegmentEditorErrors | undefined;
  status?: EditSessionStatus | undefined;
  disabled?: boolean | undefined;
  labelSlotProps?: BlockSegmentEditorLabelSlotProps | undefined;
};
