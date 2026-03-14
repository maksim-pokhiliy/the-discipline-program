export enum SectionType {
  FOR_TIME = "FOR_TIME",
  AMRAP = "AMRAP",
  EMOM = "EMOM",
  TABATA = "TABATA",
  STRENGTH = "STRENGTH",
  CUSTOM = "CUSTOM",
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  [SectionType.FOR_TIME]: "For Time",
  [SectionType.AMRAP]: "AMRAP",
  [SectionType.EMOM]: "EMOM",
  [SectionType.TABATA]: "Tabata",
  [SectionType.STRENGTH]: "Strength",
  [SectionType.CUSTOM]: "Custom",
};

export enum ScoreType {
  TIME = "TIME",
  ROUNDS_REPS = "ROUNDS_REPS",
  LOAD = "LOAD",
  REPS = "REPS",
  PASS_FAIL = "PASS_FAIL",
  NONE = "NONE",
}

export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  [ScoreType.TIME]: "Time",
  [ScoreType.ROUNDS_REPS]: "Rounds + Reps",
  [ScoreType.LOAD]: "Load",
  [ScoreType.REPS]: "Reps",
  [ScoreType.PASS_FAIL]: "Pass/Fail",
  [ScoreType.NONE]: "None",
};
