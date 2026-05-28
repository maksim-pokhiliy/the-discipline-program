import type { CanonicalWeek } from "../canonical-schema";

import { DAY_WK1_FRI } from "./week-1-friday";
import { DAY_WK1_MON } from "./week-1-monday";
import { DAY_WK1_SAT } from "./week-1-saturday";
import { DAY_WK1_SUN } from "./week-1-sunday";
import { DAY_WK1_THU } from "./week-1-thursday";
import { DAY_WK1_TUE } from "./week-1-tuesday";
import { DAY_WK1_WED } from "./week-1-wednesday";

export const WEEK_1: CanonicalWeek = {
  weekIndex: 1,
  sheetRef: "sheet-01",
  weekOffsetFromTodayWeeks: 0,
  notes: null,
  days: [DAY_WK1_MON, DAY_WK1_TUE, DAY_WK1_WED, DAY_WK1_THU, DAY_WK1_FRI, DAY_WK1_SAT, DAY_WK1_SUN],
};
