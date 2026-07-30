import { alpha, type Theme } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import {
  PULSE_BG_ALPHA,
  PULSE_FADE_ALPHA,
  PULSE_RING_ALPHA,
  PULSE_RING_WIDTH_PX,
} from "./weight-sheet.constants";

type PulseKeyframes = ReturnType<typeof keyframes>;

const byAccent = new Map<string, PulseKeyframes>();

const serializePulse = (accent: string): PulseKeyframes => keyframes`
    0% {
      background-color: ${alpha(accent, PULSE_BG_ALPHA)};
      box-shadow: 0 0 0 ${PULSE_RING_WIDTH_PX}px ${alpha(accent, PULSE_RING_ALPHA)};
    }
    100% {
      background-color: ${alpha(accent, PULSE_FADE_ALPHA)};
      box-shadow: 0 0 0 ${PULSE_RING_WIDTH_PX}px ${alpha(accent, PULSE_FADE_ALPHA)};
    }
  `;

export const buildPulseKeyframes = (theme: Theme): PulseKeyframes => {
  const accent = theme.palette.primary.main;
  const cached = byAccent.get(accent);

  if (cached !== undefined) {
    return cached;
  }

  const serialized = serializePulse(accent);

  byAccent.set(accent, serialized);

  return serialized;
};
