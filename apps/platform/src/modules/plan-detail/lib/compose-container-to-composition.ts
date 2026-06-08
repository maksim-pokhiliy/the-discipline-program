import type {
  Composition,
  RepetitionAxis as ContractRepetitionAxis,
  ScoringDirective as ContractScoringDirective,
} from "@repo/contracts/lms/composition";

import type {
  ComposeContainer,
  RepetitionAxis,
  ScoringDirective,
} from "../components/axes/axis-draft.types";

const mapRepetition = (repetition: RepetitionAxis): ContractRepetitionAxis => {
  switch (repetition.kind) {
    case "once":
      return { kind: "once" };
    case "count":
      return { kind: "count", count: repetition.count };
    case "ladder":
      return { kind: "ladder", steps: repetition.steps };
    case "timeCap":
      return { kind: "timeCap", cap: repetition.cap };
    case "cadence":
      return {
        kind: "cadence",
        everyMin: repetition.everyMin,
        rounds: repetition.rounds,
        ...(repetition.totalMin !== undefined && { totalMin: repetition.totalMin }),
      };
    case "window":
      return { kind: "window", startHhMm: repetition.startHhMm, endHhMm: repetition.endHhMm };
    case "interval":
      return {
        kind: "interval",
        workMin: repetition.workMin,
        offMin: repetition.offMin,
        count: repetition.count,
      };
    default:
      return repetition satisfies never;
  }
};

const mapScoring = (scoring: ScoringDirective): ContractScoringDirective => {
  switch (scoring.kind) {
    case "prescribed":
      return { kind: "prescribed" };
    case "amrap":
      return { kind: "amrap" };
    case "for_time":
      return { kind: "for_time" };
    case "max_in_remaining":
      return { kind: "max_in_remaining" };
    case "total":
      return { kind: "total" };
    case "progressive":
      return { kind: "progressive", seed: scoring.seed };
    default:
      return scoring satisfies never;
  }
};

export const composeContainerToComposition = (container: ComposeContainer): Composition => ({
  ...(container.repetition !== undefined && { repetition: mapRepetition(container.repetition) }),
  ...(container.scoring !== undefined && { scoring: mapScoring(container.scoring) }),
  ...(container.rest !== undefined && { rest: container.rest }),
  ...(container.programKind !== undefined && { programKind: container.programKind }),
});
