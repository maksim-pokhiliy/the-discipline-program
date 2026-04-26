export type CaretTriggerResult = {
  kind: string;
  query: string;
};

export const findCaretTrigger = (
  text: string,
  caret: number,
  triggers: readonly string[],
): CaretTriggerResult | null => {
  for (let i = caret - 1; i >= 0; i -= 1) {
    const ch = text[i];

    if (ch === undefined) {
      return null;
    }

    if (ch === " " || ch === "\n" || ch === "\t") {
      return null;
    }

    if (triggers.includes(ch)) {
      return { kind: ch, query: text.slice(i + 1, caret) };
    }
  }

  return null;
};
