import { type BlockInventoryEntry } from "./inventory.js";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export interface SheetSessionLayout {
  order: number;
  sessionLabel: string; // "1ST SESSION"
  blocks: { blockRef: string; rowStart: number }[];
}

export interface SheetDayLayout {
  dayOfWeek: DayOfWeek;
  isRest: boolean;
  sessions: SheetSessionLayout[];
}

export interface SheetLayout {
  weekIndex: number;
  sheetRef: string;
  days: SheetDayLayout[];
}

export function buildSheetLayouts(inventory: Map<string, BlockInventoryEntry>): SheetLayout[] {
  // (sheet, day, session) → list of {blockRef, rowStart}
  const locIndex = new Map<string, { blockRef: string; rowStart: number }[]>();

  for (const entry of inventory.values()) {
    for (const loc of entry.locations) {
      const key = `${loc.sheet}|${loc.day}|${loc.session}`;
      let bucket = locIndex.get(key);

      if (!bucket) {
        bucket = [];
        locIndex.set(key, bucket);
      }

      bucket.push({ blockRef: entry.ref, rowStart: loc.rowStart });
    }
  }

  const sheets: SheetLayout[] = [];

  for (let weekIndex = 1; weekIndex <= 33; weekIndex++) {
    const sheetRef = `sheet-${String(weekIndex).padStart(2, "0")}`;
    const days: SheetDayLayout[] = DAY_ORDER.map((dayOfWeek) => {
      // Collect distinct session labels appearing for this (sheet, day)
      const sessionKeys = Array.from(locIndex.keys()).filter((k) =>
        k.startsWith(`${sheetRef}|${dayOfWeek}|`),
      );

      if (sessionKeys.length === 0) {
        return { dayOfWeek, isRest: true, sessions: [] };
      }

      const sessions: SheetSessionLayout[] = [];
      // Sample has 1 session per day; preserve order encountered.
      // Group sessions by label
      const sessionLabels = sessionKeys.map((k) => k.split("|")[2]!);
      const uniqueLabels = Array.from(new Set(sessionLabels));

      uniqueLabels.forEach((sessionLabel, idx) => {
        const key = `${sheetRef}|${dayOfWeek}|${sessionLabel}`;
        const bucket = (locIndex.get(key) ?? []).slice().sort((a, b) => a.rowStart - b.rowStart);

        sessions.push({
          order: idx + 1,
          sessionLabel,
          blocks: bucket,
        });
      });

      return { dayOfWeek, isRest: false, sessions };
    });

    sheets.push({ weekIndex, sheetRef, days });
  }

  return sheets;
}
