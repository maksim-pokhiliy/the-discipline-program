import { type Intensity } from "@repo/contracts/lms/_shared";

const EFFORT_RE = /^(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*%\s*effort$/i;

export function tryParseIntensity(inner: string): Intensity | null {
  const txt = inner.trim();
  const e = txt.match(EFFORT_RE);

  if (e) {
    if (e[2]) {
      return {
        effortPercent: {
          range: { min: parseInt(e[1]!, 10), max: parseInt(e[2], 10) },
        },
      };
    }

    return { effortPercent: { value: parseInt(e[1]!, 10) } };
  }

  return null;
}
