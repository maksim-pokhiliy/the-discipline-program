import { type DayOfWeek } from "@repo/contracts/lms/_shared";

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export const DATE_COL_W = { xs: 46, md: 54 } as const;
export const TIMELINE_COL_W = { xs: 28, md: 30 } as const;

export const NODE_SIZE_TODAY = 16;
export const NODE_SIZE_DONE_TODO = 14;
export const NODE_SIZE_REST = 7;
export const NEXT_HINT_NODE_SIZE = 10;

export const RAIL_LEFT = { xs: 13, md: 14 } as const;
export const RAIL_WIDTH_PX = 2;
export const NODE_TOP = { xs: 17, md: 18 } as const;
export const NEXT_HINT_RAIL_HEIGHT = { xs: 30, md: 32 } as const;

export const WEEK_LABEL_PX = { xs: 30, md: 38 } as const;
export const DAY_NUM_PX = { xs: 24, md: 27 } as const;
export const WEEKDAY_PX = 10;
export const DATE_RANGE_PX = { xs: 13, md: 14 } as const;
export const PROGRESS_TEXT_PX = { xs: 12, md: 13 } as const;
export const ACTION_TEXT_PX = 12;
export const PILL_TEXT_PX = 12;
export const CARD_TITLE_PX = { xs: 14, md: 15 } as const;
export const CARD_SUBTITLE_PX = 13;
export const REST_DAY_PX = 14;
export const TODAY_CHIP_PX = 11;
export const HINT_TEXT_PX = 13;
export const EMPTY_TITLE_PX = { xs: 22, md: 26 } as const;
export const EMPTY_BODY_PX = 14;

export const TRAIL_ICON_PX = 22;
export const ACTION_ICON_PX = 16;
export const HINT_ICON_PX = 18;
export const NAV_CHEVRON_PX = { xs: 26, md: 28 } as const;
export const NAV_BUTTON_PX = { xs: 40, md: 42 } as const;
export const EMPTY_ICON_PX = { xs: 28, md: 32 } as const;
export const EMPTY_CIRCLE_PX = { xs: 56, md: 64 } as const;

export const TODAY_GLOW_ALPHA = 0.18;
export const TODAY_CHIP_BG_ALPHA = 0.18;
export const NODE_HOLLOW_ALPHA = 0.22;
export const NODE_REST_ALPHA = 0.22;
export const RAIL_ALPHA = 0.1;
export const DONE_TITLE_ALPHA = 0.55;
export const DONE_DATE_ALPHA = 0.5;
export const TRAIL_MUTED_ALPHA = 0.5;
export const CARD_ACTIVE_ALPHA = 0.05;
export const DOT_PAST_ALPHA = 0.35;
export const DOT_FUTURE_ALPHA = 0.14;
export const PILL_BORDER_ALPHA = 0.18;
export const NAV_DISABLED_OPACITY = 0.25;

export const DOT_HEIGHT_PX = 4;
export const DOT_TRANSITION_MS = 195;
export const DOT_W_CUR = { xs: 26, md: 30 } as const;
export const DOT_W_OTHER = { xs: 14, md: 16 } as const;

export const TODAY_CHIP_HEIGHT_PX = 20;
export const TODAY_CHIP_PADDING_X_PX = 8;
export const PILL_HEIGHT_PX = 30;
export const PILL_PADDING_X_PX = 14;
export const PILL_RADIUS_PX = 9999;
export const CARD_PADDING_Y = { xs: 13, md: 15 } as const;
export const CARD_PADDING_X = { xs: 14, md: 16 } as const;
export const EMPTY_BODY_MAX_W = { xs: 260, md: 320 } as const;
export const EMPTY_BODY_LINE_HEIGHT = 1.6;

export const SCROLL_ANCHOR_OFFSET_PX = 150;
export const MAIN_MAX_WIDTH_PX = 600;
export const FIRST_WEEK_LABEL_OFFSET = 1;

export const FONT_WEIGHT_SEMI_BOLD = 600;
export const FONT_WEIGHT_DISPLAY = 700;
export const FONT_WEIGHT_MEDIUM = 500;

export const WEEK_LABEL_LETTER_SPACING = "-0.01em";
export const WEEKDAY_LETTER_SPACING = "0.08em";
export const ACTION_LETTER_SPACING = "0.04em";
export const CHIP_LETTER_SPACING = "0.04em";

export const EMPTY_TITLE_LABEL = "No active plans";
export const EMPTY_BODY_LABEL =
  "When your coach enrolls you in a plan, your training timetable shows up here.";
export const EMPTY_PLAN_WEEKS_LABEL = "No sessions in this plan yet.";
export const REST_DAY_LABEL = "Rest day";
export const TODAY_CHIP_LABEL = "Today";
export const TODAY_JUMP_LABEL_SHORT = "Today";
export const TODAY_JUMP_LABEL_LONG = "Jump to today";
export const END_OF_PLAN_LABEL = "End of plan";
export const LOADING_LABEL = "Loading your plan...";
