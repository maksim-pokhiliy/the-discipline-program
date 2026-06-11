import { type Composition, compositionSchema } from "@repo/contracts/lms/composition";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { composeContainerToComposition } from "./compose-container-to-composition";
import { formatZodIssue } from "./format-zod-issue";

const BUILD_FAILURE_FALLBACK = "Could not build composition.";

export type CompositionResult =
  | { ok: true; composition: Composition }
  | { ok: false; error: string };

export const previewComposition = (draft: ComposeContainer): Composition =>
  composeContainerToComposition(draft);

export const buildComposition = (draft: ComposeContainer): CompositionResult => {
  const composition = composeContainerToComposition(draft);
  const parsed = compositionSchema.safeParse(composition);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return {
      ok: false,
      error: issue === undefined ? BUILD_FAILURE_FALLBACK : formatZodIssue(issue),
    };
  }

  return { ok: true, composition: parsed.data };
};
