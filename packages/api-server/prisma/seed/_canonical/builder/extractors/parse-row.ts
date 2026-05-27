import {
  type Intensity,
  type Load,
  type MediaReference,
  type PerLimbDistribution,
  type RepNotation,
  type SequenceIndicator,
  type TempoModifier,
  type CompoundRow,
  type CompoundRowElement,
} from "@repo/contracts/lms/_shared";
import { type Position } from "@repo/contracts/lms/schema-row";

import { type CanonicalRow } from "../../canonical-schema.js";
import { type ExerciseResolver } from "../utils/exercise-resolver.js";

import { extractBrackets } from "./brackets.js";
import { tryParseIntensity } from "./intensity.js";
import { tryParseLoad } from "./load.js";
import { tryParseInlineUrl, tryParseStandaloneUrl } from "./media.js";
import { tryParsePosition } from "./position.js";
import { parseRepLead } from "./reps.js";
import { parseInlineRest } from "./restspec.js";
import { tryParseSequence } from "./sequence.js";
import { tryParseSide } from "./side.js";
import { tryParseTempo } from "./tempo.js";

const REST_LINE_RE = /^-\s.+\s-$|^-\s.+-$/;

export type RowDraft = Omit<CanonicalRow, "order" | "refId">;

interface ParseContext {
  resolver: ExerciseResolver;
  /** when true, leading count is implicit (inherited from outer ladder marker). */
  implicitReps?: boolean;
}

export interface ParsedLineKind {
  kind:
    | "exercise"
    | "rest"
    | "inner-ladder-marker"
    | "standalone-load"
    | "standalone-url"
    | "rep-definition"
    | "placeholder"
    | "footnote"
    | "drop-set-annotation"
    | "per-set-substitution-annotation"
    | "example-annotation"
    | "explode-url"
    | "connector-then"
    | "connector-then-dots"
    | "connector-then-n-rounds"
    | "header"
    | "blank"
    | "unrecognised";
  raw: string;
}

const INNER_LADDER_RE = /^\d+(?:-\d+){1,}\s*:?$/;
const CONNECTOR_THEN_RE = /^then\s*:?$/i;
const CONNECTOR_DOTS_RE = /^\.\.\.then\.\.\.\s*:?$/i;
const CONNECTOR_THEN_N_ROUNDS_RE = /^\.\.\.then\s+(\d+)\s+rounds?\s*:?$/i;
const FOOTNOTE_RE = /^(\*\*|\*)\s*(.*)$/;
const DROP_SET_RE = /^\d+\s+sets\s*\[\s*x\d+\s*\[/i;
const EXPLODE_URL_RE = /^\[\s*EXPLODE:\s*https?:\/\//i;
const REP_DEF_RE = /^(\d+)\s+reps\s*=\s*1\s+rep\s+\[/i;
const PER_SET_SUB_RE = /^\[\s*\*?[^\]]*:\s*\d+\s*st\s+set/i;
const EXAMPLE_RE = /^\[\s*EXAMPLE:/i;

/** Classify a single line of block raw body. */
export function classifyLine(line: string): ParsedLineKind {
  const trimmed = line.trim();

  if (trimmed === "") {
    return { kind: "blank", raw: line };
  }

  if (REST_LINE_RE.test(trimmed) && /rest/i.test(trimmed)) {
    return { kind: "rest", raw: line };
  }

  if (INNER_LADDER_RE.test(trimmed) && !/[a-z]/i.test(trimmed)) {
    return { kind: "inner-ladder-marker", raw: line };
  }

  if (CONNECTOR_DOTS_RE.test(trimmed)) {
    return { kind: "connector-then-dots", raw: line };
  }

  if (CONNECTOR_THEN_N_ROUNDS_RE.test(trimmed)) {
    return { kind: "connector-then-n-rounds", raw: line };
  }

  if (CONNECTOR_THEN_RE.test(trimmed)) {
    return { kind: "connector-then", raw: line };
  }

  if (EXAMPLE_RE.test(trimmed)) {
    return { kind: "example-annotation", raw: line };
  }

  if (EXPLODE_URL_RE.test(trimmed)) {
    return { kind: "explode-url", raw: line };
  }

  if (DROP_SET_RE.test(trimmed)) {
    return { kind: "drop-set-annotation", raw: line };
  }

  if (PER_SET_SUB_RE.test(trimmed)) {
    return { kind: "per-set-substitution-annotation", raw: line };
  }

  if (REP_DEF_RE.test(trimmed)) {
    return { kind: "rep-definition", raw: line };
  }

  const standUrl = tryParseStandaloneUrl(trimmed);

  if (standUrl) {
    return { kind: "standalone-url", raw: line };
  }

  if (FOOTNOTE_RE.test(trimmed) && !DROP_SET_RE.test(trimmed)) {
    const fm = trimmed.match(FOOTNOTE_RE);

    if (fm && fm[2] && /[a-z]/i.test(fm[2])) {
      const tail = fm[2]!.trim();

      // `*<digit>` (e.g. `*100 single unders AFTER each set`) or `**…` → footnote.
      // `*<non-digit>` (e.g. `*DB exercise`, `* Burpee variation`) → placeholder.
      if (fm[1] === "**" || /^\d/.test(tail)) {
        return { kind: "footnote", raw: line };
      }

      return { kind: "exercise", raw: line }; // parseExerciseRow will route to PLACEHOLDER
    }
  }

  // header detection: ends with `:` and not exercise-y (no leading digit before `:` form)
  if (/:$/.test(trimmed) && !/^\d/.test(trimmed)) {
    return { kind: "header", raw: line };
  }

  // standalone-load: bracket-only, no exercise text
  const onlyBrack = trimmed.match(/^\[\s*([^\]]+?)\s*\]$/);

  if (onlyBrack) {
    const load = tryParseLoad(onlyBrack[1]!);

    if (load) {
      return { kind: "standalone-load", raw: line };
    }
  }

  return { kind: "exercise", raw: line };
}

interface CompoundParts {
  elements: { text: string; brackets: string[] }[];
  trailingBrackets: string[];
}

/**
 * Split a compound row on top-level `+` connectors (i.e. `+` outside `[ ]`).
 * Returns each element fragment plus any trailing brackets after the last `+`.
 */
function splitCompound(text: string): CompoundParts | null {
  let depth = 0;
  const parts: string[] = [];
  let last = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;

    if (c === "[") {
      depth++;
    } else if (c === "]") {
      depth--;
    } else if (c === "+" && depth === 0) {
      parts.push(text.slice(last, i).trim());
      last = i + 1;
    }
  }

  if (parts.length === 0) {
    return null;
  }

  parts.push(text.slice(last).trim());
  // strip empty
  const elementsRaw = parts.filter((p) => p.length > 0);

  if (elementsRaw.length < 2) {
    return null;
  }

  return {
    elements: elementsRaw.map((p) => {
      const eb = extractBrackets(p);

      return { text: eb.cleanedText, brackets: eb.brackets };
    }),
    trailingBrackets: [],
  };
}

function splitOr(text: string): { primary: string; alternative: string } | null {
  const idx = text.search(/\sOR\s/);

  if (idx === -1) {
    return null;
  }

  return {
    primary: text.slice(0, idx).trim(),
    alternative: text.slice(idx + 4).trim(),
  };
}

/** Walk brackets[] and dispatch each into the appropriate VO slot. */
interface ParsedVos {
  load: Load | null;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  position: Position | null;
  sequence: SequenceIndicator | null;
  intensity: Intensity | null;
  media: MediaReference | null;
  notes: string[];
  totalFlag: boolean;
  withoutWeight: boolean;
}

function dispatchBrackets(brackets: string[]): ParsedVos {
  const vos: ParsedVos = {
    load: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    notes: [],
    totalFlag: false,
    withoutWeight: false,
  };

  for (const inner of brackets) {
    if (inner === "") {
      continue;
    }

    if (/^TOTAL$/i.test(inner)) {
      vos.totalFlag = true;
      continue;
    }

    const load = tryParseLoad(inner);

    if (load) {
      if (!vos.load) {
        vos.load = load;
      } else {
        vos.notes.push(`extra load annotation: ${inner}`);
      }

      continue;
    }

    const side = tryParseSide(inner);

    if (side) {
      if (!vos.side) {
        vos.side = side;
      } else {
        vos.notes.push(`extra side annotation: ${inner}`);
      }

      continue;
    }

    const tempo = tryParseTempo(inner);

    if (tempo) {
      if (!vos.tempo) {
        vos.tempo = tempo;
      } else {
        vos.notes.push(`extra tempo: ${inner}`);
      }

      continue;
    }

    const seq = tryParseSequence(inner);

    if (seq) {
      if (!vos.sequence) {
        vos.sequence = seq;
      } else {
        vos.notes.push(`extra sequence: ${inner}`);
      }

      continue;
    }

    const pos = tryParsePosition(inner);

    if (pos) {
      // composite positions (HAND_ON_DB_NEUTRAL_GRIP, FROM_BOX_OR_SOFA, FROM_SOFA_BOX) carry
      // more info — let them override single-axis positions captured earlier.
      const isComposite =
        pos === "HAND_ON_DB_NEUTRAL_GRIP" || pos === "FROM_BOX_OR_SOFA" || pos === "FROM_SOFA_BOX";

      if (!vos.position || isComposite) {
        vos.position = pos;
      } else {
        vos.notes.push(`extra position: ${inner}`);
      }

      continue;
    }

    const intensity = tryParseIntensity(inner);

    if (intensity) {
      if (!vos.intensity) {
        vos.intensity = intensity;
      } else {
        vos.notes.push(`extra intensity: ${inner}`);
      }

      continue;
    }

    const media = tryParseInlineUrl(inner);

    if (media) {
      if (!vos.media) {
        vos.media = media;
      } else {
        vos.notes.push(`extra media: ${inner}`);
      }

      continue;
    }

    vos.notes.push(inner);
  }

  return vos;
}

/**
 * Parse a single exercise line into a CanonicalRow draft (no order/refId).
 * Handles atomic / compound / or_alternative / placeholder forms.
 */
export function parseExerciseRow(line: string, ctx: ParseContext): RowDraft {
  const { brackets, cleanedText } = extractBrackets(line);
  // Placeholder forms
  const phMatch = cleanedText.match(/^\*\s*(.+)$/);

  if (phMatch) {
    const phName = phMatch[1]!.trim();

    return {
      rowKind: "PLACEHOLDER",
      rowPayload: {
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: "coach_choice_slot",
          text: phName,
        },
      },
      load: null,
      reps: null,
      side: null,
      tempo: null,
      position: null,
      sequence: null,
      intensity: null,
      media: null,
      compoundRep: null,
      notes: brackets.length ? brackets.join(" | ") : null,
    };
  }

  // Bare placeholder like "biceps / triceps" or "ANY exercise for ABS"
  if (/^(biceps\s*\/\s*triceps|any\s+exercise\s+for\s+abs)$/i.test(cleanedText)) {
    const isMuscle = /^biceps/i.test(cleanedText);

    return {
      rowKind: "PLACEHOLDER",
      rowPayload: {
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: isMuscle ? "muscle_group_reference" : "purpose_category",
          text: cleanedText,
        },
      },
      load: null,
      reps: null,
      side: null,
      tempo: null,
      position: null,
      sequence: null,
      intensity: null,
      media: null,
      compoundRep: null,
      notes: null,
    };
  }

  const orSplit = splitOr(cleanedText);

  if (orSplit) {
    const primaryLead = parseRepLead(orSplit.primary);
    const altLead = parseRepLead(orSplit.alternative);
    const primaryRef = ctx.resolver.resolve(primaryLead.exerciseText);
    const altRef = ctx.resolver.resolve(altLead.exerciseText);

    return {
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: {
          form: "or_alternative",
          orAlternative: {
            primaryExerciseId: primaryRef,
            primaryReps: primaryLead.reps,
            alternativeExerciseId: altRef,
            alternativeReps: altLead.reps,
            purpose: "scale_down",
          },
        },
      },
      load: null,
      reps: null,
      side: null,
      tempo: null,
      position: null,
      sequence: null,
      intensity: null,
      media: null,
      compoundRep: null,
      notes: brackets.length ? brackets.join(" | ") : null,
    };
  }

  const vos = dispatchBrackets(brackets);
  const compound = splitCompound(cleanedText);

  if (compound) {
    const elements: CompoundRowElement[] = compound.elements.map((e) => {
      const lead = parseRepLead(e.text);
      const ref = ctx.resolver.resolve(lead.exerciseText);
      const elVos = dispatchBrackets(e.brackets);
      const reps = applyTotalFlag(lead.reps, elVos.totalFlag);
      const elem: CompoundRowElement = { exerciseId: ref, reps };

      if (elVos.load) {
        elem.load = elVos.load;
      }

      if (elVos.side) {
        elem.side = elVos.side;
      }

      return elem;
    });
    const compoundRow: CompoundRow = { elements };

    if (vos.load || vos.tempo) {
      compoundRow.sharedModifiers = {};

      if (vos.load) {
        compoundRow.sharedModifiers.load = vos.load;
      }

      if (vos.tempo) {
        compoundRow.sharedModifiers.tempo = vos.tempo;
      }
    }

    return {
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "compound", compound: compoundRow },
      },
      load: vos.load,
      reps: null,
      side: vos.side,
      tempo: vos.tempo,
      position: vos.position,
      sequence: vos.sequence,
      intensity: vos.intensity,
      media: vos.media,
      compoundRep: null,
      notes: vos.notes.length ? vos.notes.join(" | ") : null,
    };
  }

  // Atomic
  const lead = parseRepLead(cleanedText);
  const exRef = ctx.resolver.resolve(lead.exerciseText);
  const reps = applyTotalFlag(ctx.implicitReps ? { kind: "implicit" } : lead.reps, vos.totalFlag);

  return {
    rowKind: "EXERCISE",
    rowPayload: {
      rowKind: "EXERCISE",
      exercise: { form: "atomic", exerciseId: exRef },
    },
    load: vos.load,
    reps,
    side: vos.side,
    tempo: vos.tempo,
    position: vos.position,
    sequence: vos.sequence,
    intensity: vos.intensity,
    media: vos.media,
    compoundRep: null,
    notes: vos.notes.length ? vos.notes.join(" | ") : null,
  };
}

function applyTotalFlag(reps: RepNotation, totalFlag: boolean): RepNotation {
  if (!totalFlag) {
    return reps;
  }

  if (reps.kind === "count") {
    return { kind: "total_flag", value: reps.value };
  }

  return reps;
}

/** Build a REST row from an inline rest marker line. */
export function buildRestRow(line: string): RowDraft | null {
  const parsed = parseInlineRest(line);

  if (!parsed) {
    return null;
  }

  return {
    rowKind: "REST",
    rowPayload: {
      rowKind: "REST",
      raw: parsed.raw,
      parsed: parsed.spec,
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: null,
  };
}

/** Build INNER_LADDER_MARKER row from `N-M-K` line. */
export function buildInnerLadderRow(line: string): RowDraft {
  const trimmed = line.trim().replace(/:$/, "");
  const steps = trimmed.split("-").map((s) => parseInt(s, 10));

  return {
    rowKind: "INNER_LADDER_MARKER",
    rowPayload: { rowKind: "INNER_LADDER_MARKER", steps },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: null,
  };
}

/** Build STANDALONE_LOAD row from a bracket-only line. */
export function buildStandaloneLoadRow(line: string): RowDraft | null {
  const m = line.trim().match(/^\[\s*([^\]]+?)\s*\]$/);

  if (!m) {
    return null;
  }

  const load = tryParseLoad(m[1]!);

  if (!load) {
    return null;
  }

  return {
    rowKind: "STANDALONE_LOAD",
    rowPayload: {
      rowKind: "STANDALONE_LOAD",
      load,
      scope: "applies_to_all_preceding_rows",
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: null,
  };
}

/** Build STANDALONE_URL row (wrapped or bare). */
export function buildStandaloneUrlRow(line: string): RowDraft | null {
  const u = tryParseStandaloneUrl(line.trim());

  if (!u) {
    return null;
  }

  return {
    rowKind: "STANDALONE_URL",
    rowPayload: {
      rowKind: "STANDALONE_URL",
      url: u.url,
      wrapped: u.wrapped,
      appliesTo: "previous_exercise_row",
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: u.label ?? null,
  };
}

/** Build REP_DEFINITION row from `N reps = 1 rep [ ... ]`. */
export function buildRepDefRow(line: string, ctx: ParseContext): RowDraft | null {
  const m = line.trim().match(/^(\d+)\s+reps\s*=\s*1\s+rep\s+\[\s*([^\]]+?)\s*\]/i);

  if (!m) {
    return null;
  }

  const totalReps = parseInt(m[1]!, 10);
  const inner = m[2]!.trim();
  // composition: split on `+`
  const parts = inner
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const composition = parts.map((p) => {
    const cm = p.match(/^(\d+)\s+(.+)$/);
    const count = cm ? parseInt(cm[1]!, 10) : 1;
    const name = (cm ? cm[2]! : p).trim();

    return { exerciseId: ctx.resolver.resolve(name), count };
  });

  if (composition.length === 0) {
    return null;
  }

  return {
    rowKind: "REP_DEFINITION",
    rowPayload: {
      rowKind: "REP_DEFINITION",
      equality: { form: "inline_equality", totalReps, composition },
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: {
      form: "inline_equality",
      totalReps,
      composition,
    },
    notes: null,
  };
}

/** Build FOOTNOTE row from `*` / `**` prefix line. */
export function buildFootnoteRow(line: string, ctx: ParseContext): RowDraft | null {
  const m = line.trim().match(/^(\*\*|\*)\s*(.+)$/);

  if (!m) {
    return null;
  }

  const marker = m[1]! as "*" | "**";
  const body = m[2]!;
  const { brackets, cleanedText } = extractBrackets(body);
  // Detect target from brackets
  let target: "each_round" | "each_set" | "each_typed_round" = "each_set";
  let typeLabel: string | undefined;

  for (const b of brackets) {
    if (/^AFTER\s+EACH\s+ROUND$/i.test(b)) {
      target = "each_round";
    } else if (/^after\s+each\s+set$/i.test(b)) {
      target = "each_set";
    } else {
      const typed = b.match(/^after\s+each\s+([A-Z][A-Za-z]+)\s+(?:round|set)$/);

      if (typed) {
        target = "each_typed_round";
        typeLabel = typed[1]!;
      }
    }
  }

  // tail text without bracket can also indicate set/round
  if (/AFTER\s+each\s+set/i.test(cleanedText)) {
    target = "each_set";
  }

  // Body as a compound row with elements parsed
  const parts = cleanedText
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const elements: CompoundRowElement[] = parts.map((p) => {
    const lead = parseRepLead(p);

    return {
      exerciseId: ctx.resolver.resolve(lead.exerciseText),
      reps: lead.reps,
    };
  });

  return {
    rowKind: "FOOTNOTE",
    rowPayload: {
      rowKind: "FOOTNOTE",
      marker,
      target,
      content: { elements },
      ...(typeLabel ? { typeLabel } : {}),
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: brackets.length ? brackets.join(" | ") : null,
  };
}
