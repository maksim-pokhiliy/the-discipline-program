import { describe, expect, it } from "vitest";

import { type DayType } from "@repo/contracts/lms/day-type";
import { type PlanDay } from "@repo/contracts/lms/plan-day";
import { formatDateParam } from "@repo/shared";

import { groupDaysByDate } from "./group-days-by-date";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const STRENGTH_DAY_TYPE_ID = "dt-strength";
const SOFT_DELETED_DAY_TYPE_ID = "dt-deleted";

const strengthDayType: DayType = {
  id: STRENGTH_DAY_TYPE_ID,
  name: "Strength",
  color: "#3D7BC4",
  createdAt: NOW,
  updatedAt: NOW,
};

const dayTypeMap: ReadonlyMap<string, DayType> = new Map([[STRENGTH_DAY_TYPE_ID, strengthDayType]]);

const makePlanDay = (
  id: string,
  date: Date,
  dayTypeId: string | null = null,
  planId = "plan-1",
): PlanDay => ({
  id,
  planId,
  date,
  dayTypeId,
  createdAt: NOW,
  updatedAt: NOW,
});

describe("groupDaysByDate", () => {
  it("resolves dayType from the map when the dayTypeId is present", () => {
    const date = new Date(2026, 0, 5);
    const day = makePlanDay("pd-1", date, STRENGTH_DAY_TYPE_ID);

    const buckets = groupDaysByDate([day], dayTypeMap);

    expect(buckets.size).toBe(1);

    const bucket = buckets.get(formatDateParam(date));

    expect(bucket).toBeDefined();
    expect(bucket?.date).toBe(date);
    expect(bucket?.planDayId).toBe("pd-1");
    expect(bucket?.dayType).toBe(strengthDayType);
  });

  it("creates one bucket per day keyed by formatDateParam when given multiple days", () => {
    const dateMon = new Date(2026, 0, 5);
    const dateTue = new Date(2026, 0, 6);
    const dateWed = new Date(2026, 0, 7);
    const days: PlanDay[] = [
      makePlanDay("pd-mon", dateMon, STRENGTH_DAY_TYPE_ID),
      makePlanDay("pd-tue", dateTue, null),
      makePlanDay("pd-wed", dateWed, STRENGTH_DAY_TYPE_ID),
    ];

    const buckets = groupDaysByDate(days, dayTypeMap);

    expect(buckets.size).toBe(3);
    expect(buckets.get(formatDateParam(dateMon))?.planDayId).toBe("pd-mon");
    expect(buckets.get(formatDateParam(dateTue))?.planDayId).toBe("pd-tue");
    expect(buckets.get(formatDateParam(dateWed))?.planDayId).toBe("pd-wed");
  });

  it("yields a bucket with dayType null when the day's dayTypeId is null", () => {
    const date = new Date(2026, 0, 5);
    const day = makePlanDay("pd-1", date, null);

    const buckets = groupDaysByDate([day], dayTypeMap);

    const bucket = buckets.get(formatDateParam(date));

    expect(bucket).toBeDefined();
    expect(bucket?.dayType).toBeNull();
    expect(bucket?.planDayId).toBe("pd-1");
  });

  it("falls back to dayType null when the dayTypeId references a soft-deleted entry not in the map", () => {
    const date = new Date(2026, 0, 5);
    const day = makePlanDay("pd-1", date, SOFT_DELETED_DAY_TYPE_ID);

    const buckets = groupDaysByDate([day], dayTypeMap);

    const bucket = buckets.get(formatDateParam(date));

    expect(bucket).toBeDefined();
    expect(bucket?.dayType).toBeNull();
    expect(bucket?.planDayId).toBe("pd-1");
  });

  it("returns an empty map when given an empty days array", () => {
    const buckets = groupDaysByDate([], dayTypeMap);

    expect(buckets.size).toBe(0);
  });
});
