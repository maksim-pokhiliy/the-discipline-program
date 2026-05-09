import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyAddCell } from "./empty-add-cell";

const ADD_LABEL = "Add session";

const findEmittedRules = (selector: string): string[] => {
  const rules: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const sheetRules = Array.from(sheet.cssRules);

      for (const rule of sheetRules) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(selector)) {
          rules.push(rule.cssText);
        }

        if (rule instanceof CSSMediaRule) {
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule && inner.selectorText.includes(selector)) {
              rules.push(`${rule.conditionText}::${inner.cssText}`);
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return rules;
};

describe("EmptyAddCell", () => {
  it("renders an icon button labelled by the supplied aria-label", () => {
    render(<EmptyAddCell onAdd={vi.fn()} label={ADD_LABEL} />);

    expect(screen.getByRole("button", { name: ADD_LABEL })).toBeInTheDocument();
  });

  it("invokes onAdd when the button is clicked", () => {
    const onAdd = vi.fn();

    render(<EmptyAddCell onAdd={onAdd} label={ADD_LABEL} />);

    fireEvent.click(screen.getByRole("button", { name: ADD_LABEL }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("emits a top-level opacity:1 rule when alwaysVisible is true", () => {
    render(<EmptyAddCell onAdd={vi.fn()} label={ADD_LABEL} alwaysVisible />);

    const button = screen.getByRole("button", { name: ADD_LABEL });
    const className = `.${button.className.split(" ").find((c) => c.startsWith("css-")) ?? ""}`;
    const rules = findEmittedRules(className);

    expect(rules.some((r) => /opacity:\s*1/.test(r) && !r.startsWith("("))).toBe(true);
  });

  it("emits opacity:0 only inside a hover media query when alwaysVisible is false", () => {
    render(<EmptyAddCell onAdd={vi.fn()} label={ADD_LABEL} />);

    const button = screen.getByRole("button", { name: ADD_LABEL });
    const className = `.${button.className.split(" ").find((c) => c.startsWith("css-")) ?? ""}`;
    const rules = findEmittedRules(className);

    expect(rules.some((r) => r.startsWith("(hover: hover)") && /opacity:\s*0/.test(r))).toBe(true);
    expect(rules.some((r) => !r.startsWith("(") && /opacity/.test(r))).toBe(false);
  });
});
