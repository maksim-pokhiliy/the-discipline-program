import type {
  EffortPercent,
  HrZoneIntensity,
  Intensity,
  NumericPaceIntensity,
  PaceValue,
  RpeIntensity,
} from "@repo/contracts/lms/_shared";

export type ShellIntensityForm = {
  effortPercent?: EffortPercent | undefined;
  rpe?: RpeIntensity | undefined;
  pace?: PaceValue | undefined;
  hrZone?: HrZoneIntensity | undefined;
  numericPace?: NumericPaceIntensity | undefined;
};

export const buildIntensityCandidate = (form: ShellIntensityForm): Intensity => ({
  ...(form.effortPercent !== undefined && { effortPercent: form.effortPercent }),
  ...(form.rpe !== undefined && { rpe: form.rpe }),
  ...(form.pace !== undefined && { pace: form.pace }),
  ...(form.hrZone !== undefined && { hrZone: form.hrZone }),
  ...(form.numericPace !== undefined && { numericPace: form.numericPace }),
});
