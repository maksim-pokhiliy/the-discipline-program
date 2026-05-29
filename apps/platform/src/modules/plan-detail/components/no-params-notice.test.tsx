import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ArchetypeName } from "@repo/contracts/lms/schema";

import { render } from "@app/test/render";

import { EmptyParamsForm } from "./no-params-notice";

const EMPTY_ARCHETYPES: ArchetypeName[] = [
  "single-line-with-then-connector",
  "single-line-bare",
  "flat-list-headerless",
  "pull-ups-dips-cycle",
  "placeholder-body",
  "practice-list",
  "url-only-body",
];

describe("EmptyParamsForm banner", () => {
  it.each(EMPTY_ARCHETYPES)("renders the archetype-name notice for %s", (archetype) => {
    render(<EmptyParamsForm archetype={archetype} />);

    expect(
      screen.getByText(`${archetype} has no parameters — its shape is its body (the rows).`),
    ).toBeInTheDocument();
  });
});

describe("EmptyParamsForm controlled-prop inertness", () => {
  it("never calls an onChange handler because it ignores the controlled contract", () => {
    const onChange = vi.fn();

    render(<EmptyParamsForm archetype="single-line-bare" />);

    expect(onChange).not.toHaveBeenCalled();
  });
});
