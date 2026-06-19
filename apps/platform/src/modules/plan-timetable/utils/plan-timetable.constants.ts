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

export const NODE_SIZE_TODAY = 16;
export const NODE_SIZE_DONE_TODO = 14;
export const NODE_SIZE_REST = 7;
export const NEXT_HINT_NODE_SIZE = 10;

export const RAIL_WIDTH_PX = 2;
export const TIMELINE_COL_W = 18;
export const NEXT_HINT_RAIL_HEIGHT = { xs: 30, md: 32 } as const;

export const TIMELINE_DOT_OFFSET = { xs: 22, md: 24 } as const;
export const DATE_LINE_GAP = 1.5;
export const TIMELINE_DATE_PT = { xs: 1.25, md: 1.5 } as const;
export const TIMELINE_CONTENT_PT = { xs: 1.25, md: 1.5 } as const;
export const TIMELINE_CONTENT_PB = { xs: 1, md: 1.25 } as const;
export const TIMELINE_CONTENT_PX = { xs: 1, md: 1.5 } as const;
export const TIMELINE_HINT_CONTENT_PT = { xs: 0.75, md: 1 } as const;

export const PLAN_RAIL_WIDTH_PX = 320;
export const RAIL_PAD_Y = 3;
export const PLAN_RAIL_PAD_X = 2.5;
export const RAIL_HEADER_PB = 2;

export const RAIL_EYEBROW_PX = 11;
export const RAIL_CARD_TITLE_PX = 14;
export const RAIL_CARD_PADDING_PX = 14;
export const RAIL_META_PX = 12;
export const RAIL_BAR_HEIGHT_PX = 4;
export const RAIL_BAR_TRACK_ALPHA = 0.1;
export const RAIL_CARD_SELECTED_BG_ALPHA = 0.06;

export const WEEKS_NAV_LABEL_PX = 13;
export const WEEKS_NAV_META_PX = 11;
export const WEEKS_NAV_TODAY_DOT_PX = 6;
export const WEEKS_NAV_CHECK_PX = 16;
export const WEEKS_NAV_INDENT_PX = 13;
export const WEEKS_NAV_SELECTED_BG_ALPHA = 0.08;
export const WEEKS_NAV_SELECTED_BORDER_ALPHA = 0.5;

export const WEEK_COUNT_INDICATOR_PX = 13;
export const DOTS_MAX_COUNT = 16;

export const PLAN_RAIL_EYEBROW_LABEL = "Your Plans";
export const PLAN_WEEKS_EYEBROW_LABEL = "Plan Weeks";
export const PLAN_ACTIVE_SUFFIX = "active";

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

export const REST_CARD_SURFACE_ALPHA = 0.025;
export const REST_CARD_STRIPE_ALPHA = 0.06;
export const REST_STRIPE_TRANSPARENT_PX = 9;
export const REST_STRIPE_PERIOD_PX = 10;
export const REST_CARD_PAD_X = 2;
export const REST_CARD_PAD_Y = 1.5;

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
export const EMPTY_DAY_LABEL = "No sessions yet";
export const TODAY_CHIP_LABEL = "Today";
export const TODAY_JUMP_LABEL_SHORT = "Today";
export const TODAY_JUMP_LABEL_LONG = "Jump to today";
export const END_OF_PLAN_LABEL = "End of plan";
export const LOADING_LABEL = "Loading your plan...";
