import { type z } from "zod";

import { type BlockSegment } from "@repo/contracts/lms/block-segment";

import { type EditSessionStatus } from "../../edit-session";

export type BlockSegmentEditorErrors = z.ZodError | null;

export type BlockSegmentEditorProps = {
  segment: BlockSegment;
  onChange: (next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void;
  errors?: BlockSegmentEditorErrors;
  status?: EditSessionStatus;
  disabled?: boolean;
};
