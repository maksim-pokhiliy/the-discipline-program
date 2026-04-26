import { type ChangeEvent, type KeyboardEvent, type RefCallback } from "react";

import { type z } from "zod";

import { type BlockSegment } from "@repo/contracts/lms/block-segment";

import { type EditSessionStatus } from "../../edit-session";

export type BlockSegmentEditorErrors = z.ZodError | null;

export type BlockSegmentEditorLabelSlotProps = {
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  inputRef?: RefCallback<HTMLInputElement | HTMLTextAreaElement>;
};

export type BlockSegmentEditorProps = {
  segment: BlockSegment;
  onChange: (next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void;
  errors?: BlockSegmentEditorErrors;
  status?: EditSessionStatus;
  disabled?: boolean;
  labelSlotProps?: BlockSegmentEditorLabelSlotProps;
};
