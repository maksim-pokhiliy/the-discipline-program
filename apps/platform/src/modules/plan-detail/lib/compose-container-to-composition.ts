import type {
  Composition,
  RepetitionAxis as ContractRepetitionAxis,
} from "@repo/contracts/lms/composition";

import type { ComposeContainer, RepetitionAxis } from "../components/axes/axis-draft.types";

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
      return { kind: "cadence", everyMin: repetition.everyMin, rounds: repetition.rounds };
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

export const composeContainerToComposition = (container: ComposeContainer): Composition => ({
  ...(container.repetition !== undefined && { repetition: mapRepetition(container.repetition) }),
  ...(container.rest !== undefined && { rest: container.rest }),
});
