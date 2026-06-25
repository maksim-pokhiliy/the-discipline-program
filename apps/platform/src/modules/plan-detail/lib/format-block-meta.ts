import { type Intensity } from "@repo/contracts/lms/_shared";
import {
  type EmphasizedIntensityText,
  type IntensityDimension,
  type IntensityLevel,
  type ResolvedIntensity,
  buildEffectiveIntensityTexts,
  buildIntensityTexts,
} from "@repo/contracts/lms/row-text";
import { type IndicatorChipTone } from "@repo/ui";

const TONE_PRIMARY: IndicatorChipTone = "primary";
const TONE_INFO: IndicatorChipTone = "info";
const TONE_DEFAULT: IndicatorChipTone = "default";

const TONE_BY_DIMENSION: Record<IntensityDimension, IndicatorChipTone> = {
  effortPercent: TONE_PRIMARY,
  rpe: TONE_INFO,
  pace: TONE_DEFAULT,
  hrZone: TONE_INFO,
  numericPace: TONE_DEFAULT,
};

export type IntensityChipDescriptor = {
  tone: IndicatorChipTone;
  text: string;
};

export type EmphasizedIntensityChip = IntensityChipDescriptor & {
  dimension: IntensityDimension;
  inherited: boolean;
};

export const toEmphasizedIntensityChips = (
  chips: EmphasizedIntensityText[],
): EmphasizedIntensityChip[] =>
  chips.map((chip) => ({
    dimension: chip.dimension,
    tone: TONE_BY_DIMENSION[chip.dimension],
    text: chip.text,
    inherited: chip.inherited,
  }));

export const formatIntensityChips = (intensity: Intensity | null): IntensityChipDescriptor[] =>
  buildIntensityTexts(intensity).map((chip) => ({
    tone: TONE_BY_DIMENSION[chip.dimension],
    text: chip.text,
  }));

export const formatEffectiveIntensityChips = (
  resolved: ResolvedIntensity,
  level: IntensityLevel,
): EmphasizedIntensityChip[] =>
  toEmphasizedIntensityChips(buildEffectiveIntensityTexts(resolved, level));
