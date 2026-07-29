import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";

export const CHIP_SOURCE_SEPARATOR = " · ";
export const CHIP_COORD_SEPARATOR = " · ";
export const CHIP_LABEL_SEPARATOR = ", ";
export const CHIP_ACTION_LABEL = "change";
export const ONE_RM_OF_PREFIX = "% of ";
export const PERCENT_SUFFIX = "%";
export const RANGE_SEPARATOR = "–";
export const SET_YOUR_MAX_LABEL = "Set your max";
export const PICK_YOUR_LEVEL_LABEL = "Pick your level";
export const PROFILE_CELL_SEPARATOR = ": ";

export const CHIP_GAP_PX = 5;
export const CHIP_PADDING_Y_PX = 6;
export const CHIP_PADDING_X_PX = 8;
export const CHIP_MARGIN_LEFT_PX = 2;
export const CHIP_SOURCE_PX = 12;
export const CHIP_CHEVRON_PX = 16;
export const CHIP_CHEVRON_ALPHA = 0.65;
export const CHIP_NARROW_BREAKPOINT_PX = 360;
export const CHIP_SOURCE_MAX_WIDTH_PX = { narrow: 118, phone: 168, desktop: 260 } as const;
export const DOTTED_UNDERLINE_ALPHA = 0.6;

export const RECEIPT_LEVEL_APPLIED = " applied · ";
export const RECEIPT_LEVEL_SUFFIX_SINGULAR = " weight updated";
export const RECEIPT_LEVEL_SUFFIX_PLURAL = " weights updated";
export const RECEIPT_COORD_SEPARATOR = " · ";
export const RECEIPT_COORD_MAX_CHARS = 24;
export const RECEIPT_MAX_INFIX = " 1RM · ";
export const RECEIPT_MAX_SUFFIX = " kg saved";

export const PULSE_DURATION_MS = 1400;
export const PULSE_CLEAR_MS = 1600;
export const PULSE_RING_WIDTH_PX = 1;
export const PULSE_BG_ALPHA = 0.35;
export const PULSE_RING_ALPHA = 0.7;
export const PULSE_FADE_ALPHA = 0;

export const LEVEL_SHEET_TITLE = "Your level";
export const LEVEL_SHEET_SUBTITLE = "Sets the weights this plan resolves for you.";
export const PREVIEW_ROW_PREFIX = "This row · ";
export const PREVIEW_VALUE_SEPARATOR = ": ";
export const PREVIEW_ARROW = " → ";
export const SCOPE_LINE_PREFIX = "Applies to ";
export const SCOPE_LINE_WEIGHT_SINGULAR = " weight";
export const SCOPE_LINE_WEIGHT_PLURAL = " weights";
export const SCOPE_LINE_SUFFIX = " in this session — and this whole plan.";
export const APPLY_CTA_PREFIX = "Apply ";
export const PICK_CTA_PREFIX = "Pick ";
export const APPLY_COORD_MAX_CHARS = 14;

export const MAX_SHEET_TITLE_PREFIX = "Your ";
export const MAX_SHEET_TITLE_SUFFIX = " max";
export const MAX_SHEET_SUBTITLE_PREFIX = "This plan asks for ";
export const MAX_SHEET_SUBTITLE_SUFFIX = " of it.";
export const LATEST_RECORD_PREFIX = "Latest record · ";
export const LATEST_RECORD_SEPARATOR = " · ";
export const MAX_INPUT_LABEL = "New 1RM (kg)";
export const MAX_INPUT_PLACEHOLDER = "0";
export const MAX_INPUT_MODE = "decimal";
export const MAX_HELPER_WITH_RECORD =
  "Corrections add a newer record — the latest wins. Full history lives on Records.";
export const MAX_HELPER_NO_RECORD_PREFIX = "Used wherever this plan asks for a % of your ";
export const MAX_HELPER_NO_RECORD_SUFFIX = ". You can correct it any time.";
export const MAX_SAVE_CTA_PREFIX = "Save ";
export const MAX_SAVE_CTA_SUFFIX = " kg";
export const MAX_SAVE_CTA_INVALID = "Enter weight";
export const MAX_OFFLINE_MESSAGE = "No connection — your max is unchanged.";

export const SOURCE_CHIP_COLOR = {
  [OneRMRecordSource.TESTED]: "success",
  [OneRMRecordSource.MANUAL]: "info",
  [OneRMRecordSource.AUTO_INFERRED]: "warning",
} as const;

export const SHEET_DIALOG_MAX_WIDTH = "xs";
export const SHEET_SAFE_AREA_PAD = "calc(env(safe-area-inset-bottom) + 24px)";
export const SHEET_PADDING_TOP = 2;
export const SHEET_PADDING_X = 2.5;
export const SHEET_HANDLE_MARGIN_BOTTOM = 1.5;
export const SHEET_BODY_GAP = 2;
export const SHEET_SECTION_GAP = 1;
export const SHEET_ACTIONS_GAP = 1;
export const SHEET_STRIP_PADDING_Y = 1;
export const SHEET_STRIP_PADDING_X = 1.25;
export const SHEET_STRIP_RADIUS_PX = 4;
export const SHEET_STRIP_BG_ALPHA = 0.08;
export const SHEET_STRIP_ICON_PX = 16;
export const SHEET_STRIP_PX = 12;
export const SHEET_STRIP_LINE_HEIGHT = 1.5;
export const AXIS_LABEL_PX = 11;
export const SCOPE_LINE_PX = 12;
