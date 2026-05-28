import { type z } from "zod";

import { type trailingConnectorSchema } from "@repo/contracts/lms/schema";

export type TrailingConnector = z.infer<typeof trailingConnectorSchema>;

type ConnectorMatch = {
  connector: TrailingConnector;
  matchedText: string;
};

type ConnectorMatcher = {
  regex: RegExp;
  build: (match: RegExpMatchArray) => TrailingConnector;
};

const MAX_ROUNDS_COUNT_EXCLUSIVE = 100;

const THEN_N_ROUNDS_RE = /^connector:\s*\.{3}\s*then\s+(\d{1,2})\s+rounds:?$/im;
const THEN_DOTS_RE = /^connector:\s*\.\.\.then\.\.\.:?$/im;
const THEN_RE = /^connector:\s*then:?$/im;

const CONNECTOR_MATCHERS: ReadonlyArray<ConnectorMatcher> = [
  {
    regex: THEN_N_ROUNDS_RE,
    build: (match) => {
      const roundsCount = Number.parseInt(match[1] ?? "0", 10);

      if (roundsCount <= 0 || roundsCount >= MAX_ROUNDS_COUNT_EXCLUSIVE) {
        throw new Error(
          `extractTrailingConnector: roundsCount ${roundsCount} out of range (0, ${MAX_ROUNDS_COUNT_EXCLUSIVE}) — regex match: "${match[0]}"`,
        );
      }

      return { form: "then_n_rounds", roundsCount };
    },
  },
  {
    regex: THEN_DOTS_RE,
    build: () => ({ form: "then_dots" }),
  },
  {
    regex: THEN_RE,
    build: () => ({ form: "then" }),
  },
];

const findConnectorMatch = (notes: string): ConnectorMatch | null => {
  for (const { regex, build } of CONNECTOR_MATCHERS) {
    const match = notes.match(regex);

    if (match !== null) {
      return { connector: build(match), matchedText: match[0] };
    }
  }

  return null;
};

const stripAllConnectorLines = (notes: string): string | null => {
  let cleaned = notes;

  for (const { regex } of CONNECTOR_MATCHERS) {
    const globalRegex = new RegExp(regex.source, "gim");

    cleaned = cleaned.replace(globalRegex, "");
  }

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned.length === 0 ? null : cleaned;
};

export const extractTrailingConnector = (
  notes: string | null,
): { connector: TrailingConnector | null; cleanedNotes: string | null } => {
  if (notes === null) {
    return { connector: null, cleanedNotes: null };
  }

  const match = findConnectorMatch(notes);

  if (match === null) {
    return { connector: null, cleanedNotes: notes };
  }

  return {
    connector: match.connector,
    cleanedNotes: stripAllConnectorLines(notes),
  };
};
