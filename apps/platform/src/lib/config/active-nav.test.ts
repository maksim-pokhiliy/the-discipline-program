import { describe, expect, it } from "vitest";

import { type PlatformNavItem } from "@repo/shared";

import { getActiveNavIndex } from "./active-nav";
import { COACH_NAVIGATION } from "./navigation";

const HOME_INDEX = 0;
const PLANS_INDEX = 1;
const ATHLETES_INDEX = 2;
const PROFILE_INDEX = 3;
const NO_MATCH = -1;

const makeNavItems = (...hrefs: string[]): PlatformNavItem[] =>
  hrefs.map((href, index) => ({ label: `Item ${index}`, href, icon: "home" }));

describe("getActiveNavIndex", () => {
  it("marks Home active on /coach", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach")).toBe(HOME_INDEX);
  });

  it("marks Plans active on /coach/plans, not Home", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/plans")).toBe(PLANS_INDEX);
  });

  it("marks Plans active on a /coach/plans/[id] detail route", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/plans/clz00000000000000000pln1")).toBe(
      PLANS_INDEX,
    );
  });

  it("marks Athletes active on /coach/athletes", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/athletes")).toBe(ATHLETES_INDEX);
  });

  it("marks Profile active on /coach/profile", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/profile")).toBe(PROFILE_INDEX);
  });

  it("returns -1 for a path outside every nav prefix", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/login")).toBe(NO_MATCH);
  });

  it("falls back to Home for an unknown /coach subpath (Home is the /coach root)", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/zzz")).toBe(HOME_INDEX);
  });

  it("picks the longest matching prefix when a path matches two items", () => {
    const items = makeNavItems("/coach", "/coach/plans");

    expect(getActiveNavIndex(items, "/coach/plans/weekly")).toBe(1);
  });

  it("keeps the longest prefix regardless of declaration order", () => {
    const items = makeNavItems("/coach/plans", "/coach");

    expect(getActiveNavIndex(items, "/coach/plans/weekly")).toBe(0);
  });

  it("keeps Plans active when the path carries a trailing slash", () => {
    expect(getActiveNavIndex(COACH_NAVIGATION.items, "/coach/plans/")).toBe(PLANS_INDEX);
  });

  it("returns -1 for an empty item list", () => {
    expect(getActiveNavIndex([], "/coach/plans")).toBe(NO_MATCH);
  });
});
