import { type DayOfWeek } from "@repo/contracts/lms/_shared";

export const WEEKDAY_LONG: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const FONT_WEIGHT_MEDIUM = 500;
export const FONT_WEIGHT_SEMI_BOLD = 600;
export const FONT_WEIGHT_DISPLAY = 700;

export const EYEBROW_LETTER_SPACING = "0.08em";
export const BLOCK_LABEL_LETTER_SPACING = "0.1em";
export const PILL_LETTER_SPACING = "0.04em";
export const TRACK_LABEL_LETTER_SPACING = "0.08em";
export const ACTION_LETTER_SPACING = "0.04em";

export const PILL_RADIUS_PX = 9999;
export const CARD_RADIUS_PX = 4;

export const META_EYEBROW_PX = 11;
export const META_TITLE_PX = { xs: 24, md: 30 } as const;
export const META_LINE_PX = 13;
export const META_ICON_PX = 16;

export const DONE_PILL_HEIGHT_PX = 22;
export const DONE_PILL_PADDING_X_PX = 10;
export const DONE_PILL_PX = 11;
export const DONE_PILL_ICON_PX = 14;
export const DONE_PILL_BG_ALPHA = 0.16;

export const BLOCK_GAP_PX = 22;
export const BLOCK_LABEL_PX = 11;
export const BLOCK_NOTE_PX = 13;
export const BLOCK_NOTE_LINE_HEIGHT = 1.5;
export const BLOCK_NOTE_ALPHA = 0.55;
export const BLOCK_RULE_ALPHA = 0.1;
export const BLOCK_LABEL_ALPHA = 0.82;

export const INTENSITY_BADGE_HEIGHT_PX = 20;
export const INTENSITY_BADGE_PADDING_X_PX = 8;
export const INTENSITY_BADGE_PX = 11;
export const INTENSITY_BADGE_LETTER_SPACING = "0.02em";
export const INTENSITY_BADGE_BG_ALPHA = 0.04;

export const GROUP_BORDER_WIDTH_PX = 2;
export const GROUP_BORDER_ALPHA = 0.3;
export const GROUP_PAD_PX = 12;
export const GROUP_LABEL_PX = 10;
export const GROUP_LABEL_LETTER_SPACING = "0.1em";
export const GROUP_ICON_PX = 15;

export const SCHEMA_GAP_PX = 10;
export const SCHEMA_HEADER_PADDING_Y_PX = 12;
export const SCHEMA_HEADER_PADDING_X_PX = 14;
export const SCHEMA_HEADER_PX = 15;
export const SCHEMA_META_PX = 12;
export const SCHEMA_META_ICON_PX = 14;
export const SCHEMA_META_ICON_ALPHA = 0.38;
export const SCHEMA_TRACK_PX = 10;
export const SCHEMA_TRACK_ALPHA = 0.4;
export const SCHEMA_DIVIDER_ALPHA = 0.08;
export const SCHEMA_BENCHMARK_BORDER_ALPHA = 0.35;

export const BENCHMARK_CHIP_ICON_PX = 13;

export const RESULT_STRIP_PADDING_Y_PX = 10;
export const RESULT_STRIP_PADDING_X_PX = 14;
export const RESULT_STRIP_BG_ALPHA = 0.08;
export const RESULT_STRIP_BORDER_ALPHA = 0.18;
export const RESULT_STRIP_ICON_PX = 18;
export const RESULT_STRIP_LABEL_PX = 10;
export const RESULT_STRIP_LABEL_ALPHA = 0.85;
export const RESULT_STRIP_LABEL_LETTER_SPACING = "0.08em";
export const RESULT_STRIP_VALUE_PX = 22;

export const ROW_PADDING_Y_PX = 11;
export const ROW_PADDING_X_PX = 14;
export const ROW_GAP_PX = 12;
export const ROW_TOP_DIVIDER_ALPHA = 0.08;
export const ROW_REPS_PX = 18;
export const ROW_MOVEMENT_PX = 14;
export const ROW_MOVEMENT_ALPHA = 0.88;
export const ROW_SUB_PX = 12;
export const ROW_NOTE_PX = 12;
export const ROW_NOTE_ALPHA = 0.45;
export const ROW_NOTE_ICON_PX = 13;

export const ROW_GROUP_PADDING_Y_PX = 10;
export const ROW_GROUP_PADDING_X_PX = 14;
export const ROW_GROUP_LABEL_PX = 10;
export const ROW_GROUP_LABEL_ALPHA = 0.45;
export const ROW_GROUP_ICON_PX = 14;
export const ROW_GROUP_MEMBER_GAP_PX = 8;
export const ROW_GROUP_MEMBER_PX = 14;
export const ROW_GROUP_MEMBER_ALPHA = 0.85;
export const ROW_GROUP_LINE_PX = 13;

export const LOAD_MIN_WIDTH_PX = 64;
export const LOAD_VALUE_PX = 20;
export const LOAD_SUB_PX = 11;
export const LOAD_SUB_ALPHA = 0.42;
export const LOAD_BW_PX = 12;
export const LOAD_HINT_PX = 11;
export const LOAD_HINT_ALPHA = 0.42;
export const LOAD_BUTTON_GAP_PX = 0.5;

export const COMPLETION_BAR_PADDING_TOP_PX = 14;
export const COMPLETION_BAR_PADDING_BOTTOM_PX = 18;
export const COMPLETION_BAR_PADDING_X_PX = 16;
export const COMPLETION_BAR_BLUR_PX = 6;
export const COMPLETION_BAR_BG_ALPHA = 0.96;
export const COMPLETION_BUTTON_HEIGHT_PX = 52;
export const COMPLETION_BUTTON_PX = 15;
export const COMPLETION_DONE_ICON_PX = 24;
export const COMPLETION_DONE_TITLE_PX = 14;
export const COMPLETION_DONE_DATE_PX = 12;
export const COMPLETION_DONE_DATE_ALPHA = 0.55;
export const COMPLETION_REOPEN_HEIGHT_PX = 38;

export const RAIL_WIDTH_PX = 400;
export const RAIL_PADDING_X_PX = 22;
export const RAIL_PADDING_Y_PX = 26;
export const RAIL_EYEBROW_PX = 11;
export const RAIL_EYEBROW_LETTER_SPACING = "0.1em";
export const RAIL_CARD_PADDING_PX = 18;
export const RAIL_CARD_TITLE_PX = 18;
export const RAIL_CARD_BODY_PX = 13;
export const RAIL_CARD_BODY_LINE_HEIGHT = 1.5;

export const CONTENT_MAX_WIDTH_PX = 760;
export const CONTENT_BOTTOM_SPACER_PX = 108;

export const COMPLETION_EYEBROW_LABEL = "Completion";
export const COMPLETION_READY_TITLE_LABEL = "Ready to log?";
export const COMPLETION_READY_BODY_LABEL =
  "One action marks the session done. It stays done — re-open any time to redo.";
export const COMPLETION_DONE_TITLE_LABEL = "Completed";
export const DONE_PILL_LABEL = "Done";
export const MARK_COMPLETED_LABEL = "Mark Completed";
export const REOPEN_LABEL = "Re-open";
export const RESULT_STRIP_HEADING_LABEL = "Your result";

export const PARALLEL_GROUP_LABEL = "Parallel";
export const TRACKS_SUFFIX_LABEL = "tracks";
export const TRACK_PREFIX_LABEL = "Track";
export const ROW_GROUP_LABEL = "Group";

export const BENCHMARK_LABEL_BY_RESULT_TYPE = {
  time: "Time",
  rounds_reps: "Rounds + Reps",
  load: "Load",
  max_reps: "Max Reps",
  distance: "Distance",
  calories: "Calories",
} as const;

export const SET_ONE_RM_LABEL = "Set 1RM";
export const PICK_PROFILE_LABEL = "Pick profile";
export const BODYWEIGHT_LABEL = "Bodyweight";
export const KG_LABEL = "kg";
export const PER_HAND_SUFFIX = "kg / hand";
export const ONE_RM_HINT_SUFFIX = "% of 1RM";
export const ONE_RM_REFERENCE_PREFIX = "1RM";
export const LOGGED_PREFIX = "Logged";
export const WORKOUT_FALLBACK_TITLE = "Workout";
export const LOADING_LABEL = "Loading your workout...";

export const SUMMARY_SEPARATOR = " · ";
export const SUB_LINE_SEPARATOR = "  ·  ";
export const PROFILE_AXIS_SEPARATOR = " · ";
