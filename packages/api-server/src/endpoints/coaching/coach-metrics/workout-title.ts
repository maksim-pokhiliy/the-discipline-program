import { DEFAULT_WORKOUT_TITLE } from "./coach-metrics.constants";

type LabelledByName = { label: { name: string } | null };

export const composeWorkoutTitle = (session: LabelledByName, day: LabelledByName): string =>
  session.label?.name ?? day.label?.name ?? DEFAULT_WORKOUT_TITLE;
