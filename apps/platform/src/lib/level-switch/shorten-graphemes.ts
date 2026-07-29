import { PICK_VALUE_ELLIPSIS } from "./level-switch.constants";

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const shortenGraphemes = (value: string, maxGraphemes: number): string => {
  const graphemes = [...graphemeSegmenter.segment(value)].map((segment) => segment.segment);

  if (graphemes.length <= maxGraphemes) {
    return value;
  }

  return `${graphemes.slice(0, maxGraphemes).join("").trim()}${PICK_VALUE_ELLIPSIS}`;
};
