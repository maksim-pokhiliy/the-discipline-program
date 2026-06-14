import { type RowKind as BadgeKind } from "@repo/ui";

export type RowSummary = {
  volume: string | null;
  load: string | null;
  side: string | null;
  tempo: string | null;
  modifiers: string[];
  notes: string[];
};

export type FormatRowResult = {
  mainText: string;
  summary: RowSummary;
  kindBadge: string;
  kindCls: BadgeKind;
  dashed: boolean;
  ord: string;
  formPillText: string | null;
  demoUrl: string | null;
};
