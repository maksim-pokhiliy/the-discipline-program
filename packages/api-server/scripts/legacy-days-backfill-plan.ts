import type { LegacyDailyProgram } from "../src/infrastructure/legacy-mobile";

export const GENERAL_CHANNEL = "GENERAL";
export const INDIVIDUAL_CHANNEL = "INDIVIDUAL";

export type PublishChannel = typeof GENERAL_CHANNEL | typeof INDIVIDUAL_CHANNEL;

export const LEGACY_TABLES = { GENERAL: "general", INDIVIDUAL: "individual" } as const;

export type LegacyProgramTable = (typeof LEGACY_TABLES)[keyof typeof LEGACY_TABLES];

export type LegacyDayContent = {
  legacyRowId: number;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type BackfillTarget = {
  dayId: string;
  planName: string;
  channel: PublishChannel;
  legacyTargetId: number | null;
  scheduledDate: string;
  legacyRowId: number;
};

export type BackfillActionKind = "fill" | "fill-from-newer-row";

export type BackfillAction = {
  kind: BackfillActionKind;
  target: BackfillTarget;
  content: LegacyDayContent;
  contentHash: string;
};

export type BackfillConflictReason =
  | "link-missing-channel-id"
  | "duplicate-legacy-row"
  | "legacy-row-older-than-ledger"
  | "rest-day-carries-a-program"
  | "training-day-carries-no-program"
  | "program-body-is-not-the-wire-shape"
  | "program-body-carries-fields-we-would-drop"
  | "duplicate-legacy-row-id";

export type BackfillWarningKind = "missing-in-legacy";

export type BackfillConflict = {
  subject: string;
  planName: string | null;
  reason: BackfillConflictReason;
  detail: string;
};

export type BackfillWarning = {
  subject: string;
  planName: string;
  kind: BackfillWarningKind;
  detail: string;
};

export type BackfillPlan = {
  actions: readonly BackfillAction[];
  conflicts: readonly BackfillConflict[];
  warnings: readonly BackfillWarning[];
  alreadyFilled: number;
};

export const ABSENT_TARGET_ID = "(none)";

export const tableForChannel = (channel: PublishChannel): LegacyProgramTable =>
  channel === INDIVIDUAL_CHANNEL ? LEGACY_TABLES.INDIVIDUAL : LEGACY_TABLES.GENERAL;

export const CHANNEL_TARGET_LABELS = {
  GENERAL: "level",
  INDIVIDUAL: "athlete",
} as const satisfies Record<PublishChannel, string>;

export const describeDay = (target: {
  channel: PublishChannel;
  legacyTargetId: number | null;
  scheduledDate: string;
}): string =>
  `${target.channel} ${CHANNEL_TARGET_LABELS[target.channel]} ` +
  `${target.legacyTargetId === null ? ABSENT_TARGET_ID : String(target.legacyTargetId)} · ` +
  target.scheduledDate;

export const describeLegacyRow = (table: LegacyProgramTable, legacyRowId: number): string =>
  `${table}_programs #${String(legacyRowId)}`;

export const legacyDayKey = (
  table: LegacyProgramTable,
  targetId: number,
  scheduledDate: string,
): string => `${table}|${String(targetId)}|${scheduledDate}`;
