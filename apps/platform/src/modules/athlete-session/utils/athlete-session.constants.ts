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
export const ROW_MOVEMENT_PX = 14;
export const ROW_MOVEMENT_ALPHA = 0.9;
export const ROW_VOLUME_PX = 19;
export const ROW_VOLUME_ALPHA = 0.92;
export const ROW_LOAD_PX = 15;
export const ROW_LOAD_ALPHA = 0.88;
export const ROW_AT_PX = 13;
export const ROW_AT_ALPHA = 0.38;
export const ROW_SUB_PX = 12;
export const ROW_NOTE_PX = 12;
export const ROW_NOTE_ALPHA = 0.45;
export const ROW_NOTE_ICON_PX = 13;
export const DEMO_ICON_PX = 18;

export const ROW_GROUP_PADDING_Y_PX = 10;
export const ROW_GROUP_PADDING_X_PX = 14;
export const ROW_GROUP_LABEL_PX = 10;
export const ROW_GROUP_LABEL_ALPHA = 0.45;
export const ROW_GROUP_ICON_PX = 14;
export const ROW_GROUP_MEMBER_GAP_PX = 8;
export const ROW_GROUP_MEMBER_PX = 14;
export const ROW_GROUP_MEMBER_ALPHA = 0.85;
export const ROW_GROUP_LINE_PX = 13;

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

export const RAIL_WIDTH_PX = 500;
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
export const CONTENT_PAD_X = 2.5;
export const CONTENT_PAD_TOP = 3;

export const COMPLETION_EYEBROW_LABEL = "Completion";
export const COMPLETION_READY_TITLE_LABEL = "Ready to log?";
export const COMPLETION_READY_BODY_LABEL =
  "One action marks the session done. Your benchmark result is logged in the workout — separately, as you finish it.";
export const COMPLETION_DONE_TITLE_LABEL = "Completed";
export const DONE_PILL_LABEL = "Done";
export const MARK_COMPLETED_LABEL = "Mark Completed";
export const REOPEN_LABEL = "Re-open · Log again";
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

export const BODYWEIGHT_LABEL = "Bodyweight";
export const KG_LABEL = "kg";
export const LOAD_AT_PREFIX = "@";
export const ABSOLUTE_PAIR_PREFIX = "2x";
export const DEMO_LINK_ARIA = "Watch demo";
export const LOGGED_PREFIX = "Logged";
export const WORKOUT_FALLBACK_TITLE = "Workout";
export const LOADING_LABEL = "Loading your workout...";

export const SUMMARY_SEPARATOR = " · ";
export const SUB_LINE_SEPARATOR = "  ·  ";
export const PROFILE_AXIS_SEPARATOR = " · ";

export const SETS_SEPARATOR = "×";
export const VOLUME_SEPARATOR = " ";
export const REPS_LABEL = "reps";
export const PICK_YOUR_PREFIX = "Pick your ";
export const AXIS_AND_SEPARATOR = " & ";
export const PROFILE_GROUP_SEPARATOR = " / ";
export const ROW_LEADER_ALPHA = 0.18;

export const SHEET_RADIUS_PX = 14;
export const SHEET_HANDLE_WIDTH_PX = 36;
export const SHEET_HANDLE_HEIGHT_PX = 4;
export const SHEET_HANDLE_ALPHA = 0.2;
export const SHEET_MAX_HEIGHT = "88%";
export const SHEET_PADDING_TOP_PX = 10;
export const SHEET_PADDING_X_PX = 18;
export const SHEET_PADDING_BOTTOM_PX = 18;

export const SHEET_TITLE_PX = 20;
export const SHEET_TITLE_ALPHA = 0.92;
export const SHEET_SUBTITLE_PX = 13;
export const SHEET_SUBTITLE_LINE_HEIGHT = 1.5;

export const LOG_PANEL_PADDING_X_PX = 14;
export const LOG_PANEL_PADDING_Y_PX = 12;
export const LOG_PANEL_TOP_BORDER_ALPHA = 0.18;
export const LOG_PANEL_PROMPT_HEIGHT_PX = 44;
export const LOG_PANEL_PROMPT_BG_ALPHA = 0.1;
export const LOG_PANEL_PROMPT_BORDER_ALPHA = 0.35;
export const LOG_PANEL_ACTION_GAP_PX = 8;
export const LOG_RESULT_PROMPT_LABEL = "Log your result";
export const SAVE_RESULT_LABEL = "Save result";
export const LOG_AGAIN_LABEL = "Log again";

export const STATUS_STRIP_PADDING_X_PX = 14;
export const STATUS_STRIP_PADDING_Y_PX = 10;
export const STATUS_STRIP_RADIUS_PX = 4;
export const STATUS_STRIP_BG_ALPHA = 0.08;
export const STATUS_STRIP_BORDER_ALPHA = 0.18;
export const STATUS_STRIP_ICON_PX = 18;
export const STATUS_STRIP_TITLE_PX = 13;
export const STATUS_STRIP_VALUE_PX = 18;
export const STATUS_STRIP_NOT_LOGGED_PX = 13;
export const STATUS_STRIP_NOT_LOGGED_LINE_HEIGHT = 1.5;
export const STATUS_STRIP_LOGGED_SUFFIX = " · logged";
export const STATUS_STRIP_NOT_LOGGED_SENTENCE =
  " result isn't logged yet — log it from the workout above. You can still complete now.";

export const RESULT_CARD_PADDING_PX = 14;
export const RESULT_CARD_BORDER_ALPHA = 0.35;
export const RESULT_CARD_TITLE_PX = 14;
export const RESULT_CARD_TITLE_ALPHA = 0.92;
export const RESULT_CARD_TYPE_PX = 11;
export const RESULT_CARD_TYPE_ALPHA = 0.45;
export const RESULT_CARD_TYPE_LETTER_SPACING = "0.06em";
export const RESULT_CARD_ICON_PX = 16;
export const RESULT_FIELD_GAP_PX = 12;
export const RESULT_UNIT_GROUP_GAP_PX = 12;
export const CANCEL_BUTTON_HEIGHT_PX = 42;

export const LOG_SESSION_TITLE = "Log this session";
export const LOG_SESSION_SUBTITLE_BENCHMARK =
  "One action marks the session done. Your benchmark result is logged in the workout — separately, as you finish it.";
export const LOG_SESSION_SUBTITLE_PLAIN = "One tap marks this session done. It stays done.";
export const NOTE_FIELD_LABEL = "Note (optional)";
export const NOTE_FIELD_PLACEHOLDER = "How did it feel? Scaling, pacing…";
export const NOTE_FIELD_ROWS = 3;
export const NOTE_FIELD_MAX_LENGTH = 2000;
export const CONFIRM_LABEL = "Mark Completed";
export const CANCEL_LABEL = "Cancel";
export const RESULT_SECTION_PREFIX = "Benchmark result";

export const TIME_MINUTES_LABEL = "Minutes";
export const TIME_SECONDS_LABEL = "Seconds";
export const ROUNDS_FIELD_LABEL = "Rounds";
export const REPS_FIELD_LABEL = "Reps";
export const LOAD_FIELD_LABEL = "Load (kg)";
export const MAX_REPS_FIELD_LABEL = "Reps";
export const DISTANCE_FIELD_LABEL = "Distance";
export const CALORIES_FIELD_LABEL = "Calories";
export const DISTANCE_UNIT_LABELS = { m: "m", km: "km" } as const;

export const SECONDS_PER_MINUTE = 60;
