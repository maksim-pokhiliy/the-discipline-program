import { type TempoModifier } from "@repo/contracts/lms/_shared";

const TEMPO_PREFIX = "Tempo ";
const TEMPO_SEPARATOR = "-";
const EXPLOSIVE_TOKEN = "X";
const PART_SEPARATOR = " · ";
const SLOW_ECC_PREFIX = "slow ecc. ";
const PAUSE_UP_PREFIX = "pause up ";
const HOLD_LAST_PREFIX = "hold last ";
const PAUSE_EVERY_PREFIX = "pause every ";
const FOR_INFIX = " for ";
const SEC_SUFFIX = "s";

export const formatTempo = (tempo: TempoModifier): string => {
  if (tempo.fullTempo !== undefined) {
    const ft = tempo.fullTempo;
    const concentric = ft.concentric === 0 ? EXPLOSIVE_TOKEN : String(ft.concentric);

    return `${TEMPO_PREFIX}${ft.eccentric}${TEMPO_SEPARATOR}${ft.pauseBottom}${TEMPO_SEPARATOR}${concentric}${TEMPO_SEPARATOR}${ft.pauseTop}`;
  }

  const parts: string[] = [];

  if (tempo.slowEccentric !== undefined) {
    parts.push(`${SLOW_ECC_PREFIX}${tempo.slowEccentric.durationSec}${SEC_SUFFIX}`);
  }

  if (tempo.pauseInUp !== undefined) {
    parts.push(`${PAUSE_UP_PREFIX}${tempo.pauseInUp.durationSec}${SEC_SUFFIX}`);
  }

  if (tempo.holdAfterLast !== undefined) {
    parts.push(`${HOLD_LAST_PREFIX}${tempo.holdAfterLast.durationSec}${SEC_SUFFIX}`);
  }

  if (tempo.perNthRepPause !== undefined) {
    parts.push(
      `${PAUSE_EVERY_PREFIX}${tempo.perNthRepPause.everyN}${FOR_INFIX}${tempo.perNthRepPause.pauseSec}${SEC_SUFFIX}`,
    );
  }

  return parts.join(PART_SEPARATOR);
};
