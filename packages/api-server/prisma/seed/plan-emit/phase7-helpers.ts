import { type CanonicalSeed } from "../plan-data/canonical-schema";

const PHASE_7_WEEK_INDEX_PADDING = 1;

export const phase7WeekIndex = (seed: CanonicalSeed): number =>
  seed.weeks.length + PHASE_7_WEEK_INDEX_PADDING;

export type Phase7Example = CanonicalSeed["phase7Examples"][number];

export const stampPhase7ExamplesOrder = (
  examples: ReadonlyArray<Phase7Example>,
): ReadonlyArray<Phase7Example> => {
  const perDayCounter = new Map<string, number>();

  return examples.map((example) => {
    const previous = perDayCounter.get(example.dayOfWeek) ?? 0;
    const order = previous + 1;

    perDayCounter.set(example.dayOfWeek, order);

    return { ...example, order };
  });
};
