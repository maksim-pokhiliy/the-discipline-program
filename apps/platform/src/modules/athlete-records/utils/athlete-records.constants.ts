import { type ResultType } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const FONT_WEIGHT_MEDIUM = 500;
export const FONT_WEIGHT_SEMI_BOLD = 600;
export const FONT_WEIGHT_DISPLAY = 700;

export const DISPLAY_NUMBER_LINE_HEIGHT = 1;
export const DISPLAY_NUMBER_LETTER_SPACING = "-0.01em";

export const CARD_VALUE_PX = 27;
export const HISTORY_VALUE_PX = 17;

export const KG_UNIT = "kg";
export const DELTA_UNIT_SEPARATOR = " ";
export const SHORT_DATE_SEPARATOR = " ";
export const LONG_DATE_SEPARATOR = " ";

export const SOURCE_CHIP_COLOR = {
  [OneRMRecordSource.TESTED]: "success",
  [OneRMRecordSource.MANUAL]: "info",
  [OneRMRecordSource.AUTO_INFERRED]: "warning",
} as const;

export const PR_CHIP_LABEL = "PR";
export const CURRENT_PR_CHIP_LABEL = "Current PR";
export const PR_CHIP_ICON_PX = 13;

export const CHART_VIEWBOX_WIDTH = 600;
export const CHART_VIEWBOX_HEIGHT = 180;
export const CHART_PAD_LEFT = 16;
export const CHART_PAD_RIGHT = 16;
export const CHART_PAD_TOP = 30;
export const CHART_PAD_BOTTOM = 28;

export const CHART_FLAT_SERIES_PAD = 1;
export const CHART_SINGLE_POINT_DIVISOR = 2;
export const CHART_COORD_PRECISION = 1;
export const CHART_VALUE_LABEL_OFFSET_PX = 11;
export const CHART_DATE_LABEL_OFFSET_PX = 18;

export const CHART_STROKE_PX = 2.2;
export const CHART_DOT_R = 3.6;
export const CHART_DOT_STROKE_PX = 2;
export const CHART_AREA_ALPHA = 0.1;

export const CHART_VALUE_LABEL_PX = 14;
export const CHART_VALUE_LABEL_ALPHA = 0.9;
export const CHART_DATE_LABEL_PX = 10;
export const CHART_DATE_LABEL_ALPHA = 0.4;

export const CHART_ANCHOR_START = "start";
export const CHART_ANCHOR_MIDDLE = "middle";
export const CHART_ANCHOR_END = "end";

export const DELTA_UNIT_BY_RESULT_TYPE: Record<ResultType, string> = {
  time: "s",
  load: "kg",
  max_reps: "reps",
  distance: "m",
  calories: "cal",
  rounds_reps: "",
};

export const CARD_RADIUS_PX = 4;
export const OPEN_BORDER_ALPHA = 0.45;
export const HISTORY_DIVIDER_ALPHA = 0.08;

export const COLLAPSED_ROW_PADDING_X_PX = 14;
export const COLLAPSED_ROW_PADDING_Y_PX = 13;
export const EXPANDED_BLOCK_PADDING_PX = 14;

export const CARD_NAME_PX = 14;
export const CARD_SUBLINE_PX = 12;
export const CARD_UNIT_PX = 11;
export const CARD_DATE_PX = 11;
export const DELTA_CHIP_PX = 11;
export const SECTION_LABEL_PX = 11;

export const CARD_UNIT_LETTER_SPACING = "0.04em";
export const SECTION_LABEL_LETTER_SPACING = "0.06em";

export const COLLAPSED_LEFT_GAP = 0.75;
export const COLLAPSED_RIGHT_GAP = 0.75;
export const COLLAPSED_NAME_ROW_GAP = 1;
export const EXPANDED_PANE_GAP_PX = 14;
export const EXPANDED_PANE_INNER_GAP = 1;
export const PROGRESS_PANE_FLEX = 1.35;
export const HISTORY_PANE_FLEX = 1;

export const HISTORY_ROW_PADDING_Y_PX = 9;
export const HISTORY_ROW_GAP = 1;
export const HISTORY_VALUE_GAP = 0.75;

export const TREND_ICON_PX = 20;
export const CHEVRON_ICON_PX = 22;
export const LOWER_IS_BETTER_ICON_PX = 14;
export const UPDATE_ONE_RM_ICON_PX = 18;

export const CHART_PANEL_PADDING_PX = 14;
export const CHART_PANEL_RADIUS_PX = 6;
export const CHART_PANEL_BORDER_ALPHA = 0.14;

export const ONE_RM_SUBLINE_PREFIX = " records · best of all-time";
export const PROGRESS_LABEL = "Progress";
export const HISTORY_LABEL = "History";
export const LOWER_IS_BETTER_LABEL = "Lower is better";
export const UPDATE_ONE_RM_LABEL = "Update this 1RM";

export const TIME_RESULT_TYPE: ResultType = "time";

export const RECORDS_TITLE = "Records";
export const RECORDS_SUBTITLE = "Your personal bests — your data, visible to your coach.";
export const LOADING_LABEL = "Loading your records...";

export const SECTION_ONE_RM = "oneRM";
export const SECTION_BENCHMARK = "benchmark";

export const ONE_RM_TAB_LABEL = "1RM";
export const BENCHMARK_TAB_LABEL = "Benchmarks";
export const UPDATE_ONE_RM_BUTTON_LABEL = "Update 1RM";

export const SEARCH_PLACEHOLDER_ONE_RM = "Search movements…";
export const SEARCH_PLACEHOLDER_BENCHMARK = "Search benchmarks…";

export const EMPTY_ONE_RM_LABEL = "No 1RMs logged yet";
export const EMPTY_BENCHMARK_LABEL = "No benchmark results yet";
export const NO_RESULTS_LABEL = "No records match your search.";

export const TOOLBAR_GAP = 2;
export const TOOLBAR_CONTROLS_GAP = 1;
export const CONTENT_STACK_GAP = 1.25;
export const TOOLBAR_TITLE_GAP = 0.5;
export const LIST_GAP = 1.25;
export const SEARCH_FIELD_WIDTH_DESKTOP_PX = 240;
export const UPDATE_BUTTON_ICON_PX = 18;
