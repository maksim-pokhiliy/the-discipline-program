import type { TempoModifier } from "@repo/contracts/lms/_shared";

const TEMPO_SEPARATOR = "-";

export const formatTempoInput = (tempo: TempoModifier | null): string => {
  if (tempo === null) {
    return "";
  }

  if (typeof tempo === "string") {
    return tempo;
  }

  return [tempo.eccentric, tempo.pauseBottom, tempo.concentric, tempo.pauseTop]
    .map((position) => String(position))
    .join(TEMPO_SEPARATOR);
};
