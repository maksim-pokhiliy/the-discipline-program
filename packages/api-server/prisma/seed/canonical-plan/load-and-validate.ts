import { archetypeParamsSchema } from "@repo/contracts/lms/schema";

import {
  canonicalSeedSchema,
  type CanonicalSchemaNode,
  type CanonicalSeed,
} from "../_canonical/canonical-schema";
import { SYNTHETIC_DEMO_PLAN } from "../_canonical/plan-synthetic";

const MAX_ZOD_ISSUES_SHOWN = 20;

const VALID_ARCHETYPE_NAMES = new Set<string>(
  archetypeParamsSchema.options.map((option) => option.shape.archetype.value),
);

const collectFromSchemaNode = (node: CanonicalSchemaNode, sink: Set<string>): void => {
  sink.add(node.archetype.archetype);

  for (const sub of node.subSchemas) {
    collectFromSchemaNode(sub, sink);
  }
};

const collectArchetypeNamesFromSeed = (seed: CanonicalSeed): Set<string> => {
  const sink = new Set<string>();

  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          for (const schema of block.schemas) {
            collectFromSchemaNode(schema, sink);
          }
        }
      }
    }
  }

  for (const example of seed.phase7Examples) {
    for (const block of example.blocks) {
      for (const schema of block.schemas) {
        collectFromSchemaNode(schema, sink);
      }
    }
  }

  return sink;
};

const assertArchetypeSpellings = (seed: CanonicalSeed): void => {
  const foundNames = collectArchetypeNamesFromSeed(seed);
  const invalid: string[] = [];

  for (const name of foundNames) {
    if (!VALID_ARCHETYPE_NAMES.has(name)) {
      invalid.push(name);
    }
  }

  if (invalid.length > 0) {
    const sortedValid = [...VALID_ARCHETYPE_NAMES].sort().join(", ");

    throw new Error(
      `Canonical seed contains archetype names not in archetypeParamsSchema: ${invalid.join(", ")}\n` +
        `Valid names (${VALID_ARCHETYPE_NAMES.size}): ${sortedValid}`,
    );
  }
};

export const loadCanonicalSeed = async (): Promise<CanonicalSeed> => {
  const result = canonicalSeedSchema.safeParse(SYNTHETIC_DEMO_PLAN);

  if (!result.success) {
    const total = result.error.issues.length;
    const errorSummary = result.error.issues
      .slice(0, MAX_ZOD_ISSUES_SHOWN)
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Synthetic Demo Plan failed Zod validation (showing first ${MAX_ZOD_ISSUES_SHOWN} issues):\n${errorSummary}\nTotal issues: ${total}`,
    );
  }

  assertArchetypeSpellings(result.data);

  return result.data;
};
