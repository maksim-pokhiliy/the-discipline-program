import {
  type LoadSpec,
  type Prescription,
  type RepSpec,
  type TempoSpec,
} from "@repo/contracts/lms/_domain";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PAD_LENGTH = 2;
const SUMMARY_SEPARATOR = " • ";
const BILATERAL_SIDE_MODE = "BILATERAL";

const formatSec = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return `${minutes}:${seconds.toString().padStart(SECONDS_PAD_LENGTH, "0")}`;
};

const formatRepSpec = (reps: RepSpec): string => {
  switch (reps.kind) {
    case "FIXED":
      return `${reps.value}`;
    case "RANGE":
      return `${reps.min}-${reps.max}`;
    case "EACH_SIDE":
      return `${reps.value}/side`;
    case "AMRAP_REPS":
      return "AMRAP";
    case "MAX":
      return "max";
  }
};

const formatLoadSpec = (load: LoadSpec): string | null => {
  switch (load.kind) {
    case "NONE":
      return null;
    case "SINGLE_DB":
      return `SD ${load.kg}kg`;
    case "DOUBLE_DB":
      return `DD 2×${load.kgEach}kg`;
    case "KB":
      return `KB ${load.kg}kg`;
    case "BARBELL":
      return `BB ${load.kg}kg`;
    case "RX_SCALED":
      return `Rx ${load.rxKg}kg / Sc ${load.scaledKg}kg`;
    case "BANDED":
      return `Banded (${load.tension})`;
    case "BODYWEIGHT_PLUS":
      return `BW + ${load.addedKg}kg`;
    case "PERCENT_BENCHMARK":
      return `${load.percent}% benchmark`;
  }
};

const formatTempoSpec = (tempo: TempoSpec): string | null => {
  if (tempo.tempoString !== undefined) {
    return tempo.tempoString;
  }

  const segments: string[] = [];

  if (tempo.pauseDownSec !== undefined) {
    segments.push(`down ${tempo.pauseDownSec}s`);
  }

  if (tempo.pauseUpSec !== undefined) {
    segments.push(`up ${tempo.pauseUpSec}s`);
  }

  if (tempo.pauseEveryNthRep !== undefined) {
    segments.push(`every ${tempo.pauseEveryNthRep.n}th ${tempo.pauseEveryNthRep.seconds}s`);
  }

  return segments.length === 0 ? null : segments.join(", ");
};

export const formatPrescriptionSummary = (prescription: Prescription): string => {
  const parts: string[] = [];

  if (prescription.reps !== undefined) {
    parts.push(formatRepSpec(prescription.reps));
  }

  if (prescription.durationSec !== undefined) {
    parts.push(formatSec(prescription.durationSec));
  }

  if (prescription.distanceM !== undefined) {
    parts.push(`${prescription.distanceM} m`);
  }

  if (prescription.calories !== undefined) {
    parts.push(`${prescription.calories} cal`);
  }

  if (prescription.load !== undefined) {
    const loadText = formatLoadSpec(prescription.load);

    if (loadText !== null) {
      parts.push(loadText);
    }
  }

  if (prescription.tempo !== undefined) {
    const tempoText = formatTempoSpec(prescription.tempo);

    if (tempoText !== null) {
      parts.push(`@ ${tempoText}`);
    }
  }

  if (prescription.sideMode !== BILATERAL_SIDE_MODE) {
    parts.push(`(${prescription.sideMode.toLowerCase()})`);
  }

  return parts.join(SUMMARY_SEPARATOR);
};
