import { type Intensity } from "@repo/contracts/lms/_shared";
import { type RowKind as BadgeKind } from "@repo/ui";

import { type EmphasizedIntensityChip } from "./format-block-meta";

export type RowIntensityContext = {
  blockIntensity: Intensity | null;
  schemaIntensity: Intensity | null;
};

export type RowSummary = {
  volume: string | null;
  load: string | null;
  side: string | null;
  tempo: string | null;
  intensityChips: EmphasizedIntensityChip[];
  rest: string | null;
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
