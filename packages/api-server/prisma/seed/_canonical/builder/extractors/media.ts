import { type MediaReference } from "@repo/contracts/lms/_shared";

const URL_RE = /^https?:\/\/\S+$/;
const LABELED_URL_RE = /^([A-Z][A-Za-z ]+):\s*(https?:\/\/\S+)$/;

export function tryParseInlineUrl(inner: string): MediaReference | null {
  const txt = inner.trim();

  if (URL_RE.test(txt)) {
    return { url: txt, position: "inline", appliesTo: "current_row" };
  }

  const labeled = txt.match(LABELED_URL_RE);

  if (labeled) {
    return {
      url: labeled[2]!,
      position: "inline",
      appliesTo: "drop_stage",
      label: labeled[1]!.trim(),
    };
  }

  return null;
}

export function tryParseStandaloneUrl(
  line: string,
): { url: string; wrapped: boolean; label?: string } | null {
  const trimmed = line.trim();
  // Wrapped: only `[ URL ]` or `[ LABEL: URL ]` on the line
  const wrapped = trimmed.match(/^\[\s*([^\]]+?)\s*\]$/);

  if (wrapped) {
    const inner = wrapped[1]!.trim();

    if (URL_RE.test(inner)) {
      return { url: inner, wrapped: true };
    }

    const labeled = inner.match(LABELED_URL_RE);

    if (labeled) {
      return { url: labeled[2]!, wrapped: true, label: labeled[1]!.trim() };
    }

    return null;
  }

  // Bare URL on its own line
  if (URL_RE.test(trimmed)) {
    return { url: trimmed, wrapped: false };
  }

  return null;
}
