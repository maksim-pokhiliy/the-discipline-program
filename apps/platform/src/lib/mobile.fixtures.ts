import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";
import {
  MOBILE_PUBLISH_ACTIONS,
  type MobilePublishAction,
  type PublishDayResult,
} from "@repo/contracts/coaching/mobile-publish";

export const NOW = new Date("2026-01-05T00:00:00.000Z");
export const WEEK_START = "2026-01-05";
const CONNECTION_TTL_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const CONNECTION_ID = "ckconn1234567890abcdef0123";
const LINK_ID = "cklink1234567890abcdef0123";
const PLAN_ID = "ckplan1234567890abcdef0123";
const LEGACY_ROW_ID = 5001;

const addDays = (base: Date, days: number): Date => new Date(base.getTime() + days * MS_PER_DAY);

const shiftIsoDate = (isoDate: string, days: number): string => {
  const shifted = new Date(`${isoDate}T00:00:00.000Z`);

  shifted.setUTCDate(shifted.getUTCDate() + days);

  return shifted.toISOString().slice(0, 10);
};

export const makeMobileConnection = (
  overrides: Partial<MobileConnection> = {},
): MobileConnection => ({
  id: CONNECTION_ID,
  legacyUserId: "1001",
  legacyUserName: "Denys Sergeev",
  legacyUserRole: "ADMIN",
  expiresAt: addDays(NOW, CONNECTION_TTL_DAYS),
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

export const makeMobileLink = (overrides: Partial<MobileLink> = {}): MobileLink => ({
  id: LINK_ID,
  planId: PLAN_ID,
  channel: "GENERAL",
  legacyLevelId: 2,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

export const makeTrainingLevel = (
  overrides: Partial<LegacyTrainingLevel> = {},
): LegacyTrainingLevel => ({
  id: 2,
  name: "Pro",
  ...overrides,
});

export const trainingLevelsFixture: LegacyTrainingLevel[] = [
  { id: 1, name: "Scaled" },
  { id: 2, name: "Pro" },
  { id: 3, name: "RX" },
];

export const makePublishDayResult = (
  overrides: Partial<PublishDayResult> = {},
): PublishDayResult => ({
  scheduledDate: WEEK_START,
  action: "created",
  legacyRowId: LEGACY_ROW_ID,
  ...overrides,
});

const legacyRowIdForAction = (action: MobilePublishAction): number | null =>
  action === "skipped" || action === "conflict" || action === "failed" ? null : LEGACY_ROW_ID;

export const publishResultsAllActions: PublishDayResult[] = MOBILE_PUBLISH_ACTIONS.map(
  (action, index) =>
    makePublishDayResult({
      scheduledDate: shiftIsoDate(WEEK_START, index),
      action,
      legacyRowId: legacyRowIdForAction(action),
    }),
);
