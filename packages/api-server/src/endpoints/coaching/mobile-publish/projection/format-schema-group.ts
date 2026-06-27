import { type ParallelInterleaveOrder, type SchemaGroup } from "@repo/contracts/lms/schema-group";

const TRACK_NOUN_SINGULAR = "track";
const TRACK_NOUN_PLURAL = "tracks";
const TRACK_SEPARATOR = " — ";
const WRAPPER_SUFFIX = ":";

const TRACK_WORDINGS: Record<ParallelInterleaveOrder, string> = {
  round_by_round: "alternating rounds",
  track_by_track: "one after another",
};

export const buildSchemaGroupWrapper = (group: SchemaGroup, trackCount: number): string => {
  const noun = trackCount === 1 ? TRACK_NOUN_SINGULAR : TRACK_NOUN_PLURAL;
  const wording = TRACK_WORDINGS[group.interleaveOrder];

  return `${trackCount} ${noun}${TRACK_SEPARATOR}${wording}${WRAPPER_SUFFIX}`;
};
