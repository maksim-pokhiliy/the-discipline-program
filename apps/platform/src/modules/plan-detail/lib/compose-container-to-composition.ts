import type {
  Composition,
  RepetitionAxis as ContractRepetitionAxis,
} from "@repo/contracts/lms/composition";

import type { RepetitionAxis, SchemaDraft } from "../components/axes/axis-draft.types";

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
        work: repetition.work,
        off: repetition.off,
        count: repetition.count,
      };
    default:
      return repetition satisfies never;
  }
};

export const composeContainerToComposition = (schema: SchemaDraft): Composition => ({
  ...(schema.repetition !== undefined && { repetition: mapRepetition(schema.repetition) }),
  ...(schema.rest !== undefined && { rest: schema.rest }),
  ...(schema.cap != null && { cap: schema.cap }),
});
