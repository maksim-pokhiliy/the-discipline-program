import type { CanonicalWeek } from "../canonical-schema";

import { DAY_WK2_FRI } from "./week-2-friday";
import { DAY_WK2_MON } from "./week-2-monday";
import { DAY_WK2_SAT } from "./week-2-saturday";
import { DAY_WK2_SUN } from "./week-2-sunday";
import { DAY_WK2_THU } from "./week-2-thursday";
import { DAY_WK2_TUE } from "./week-2-tuesday";
import { DAY_WK2_WED } from "./week-2-wednesday";

export const WEEK_2: CanonicalWeek = {
  weekIndex: 3,
  sheetRef: "sheet-02",
  weekOffsetFromTodayWeeks: 2,
  notes: null,
  days: [DAY_WK2_MON, DAY_WK2_TUE, DAY_WK2_WED, DAY_WK2_THU, DAY_WK2_FRI, DAY_WK2_SAT, DAY_WK2_SUN],
};
