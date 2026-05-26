import { type RowKind as BadgeKind } from "@repo/ui";

export type FormatRowResult = {
  mainText: string;
  subParts: string[];
  kindBadge: string;
  kindCls: BadgeKind;
  dashed: boolean;
  ord: string;
  formPillText: string | null;
  demoUrl: string | null;
};
