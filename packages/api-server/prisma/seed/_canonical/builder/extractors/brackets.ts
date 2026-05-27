export interface ExtractedBrackets {
  cleanedText: string;
  brackets: string[];
}

/**
 * Extract every `[ ... ]` annotation from a line, leaving the remainder
 * as the cleaned source text (exercise name + leading count).
 * Brackets are returned in source order; content is trimmed.
 */
export function extractBrackets(line: string): ExtractedBrackets {
  const brackets: string[] = [];
  const cleaned = line.replace(/\[([^\]]*)\]/g, (_full, inner: string) => {
    brackets.push(inner.trim());

    return " ";
  });

  return {
    cleanedText: cleaned.replace(/\s+/g, " ").trim(),
    brackets,
  };
}
