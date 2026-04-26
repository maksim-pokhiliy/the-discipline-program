import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type BlockSegment } from "@repo/contracts/lms/block-segment";

import { render } from "../../test/render";

import { BlockSegmentEditor } from "./index";

const buildSegment = (overrides: Partial<BlockSegment> = {}): BlockSegment => ({
  id: "ckabcdef0000000000000abc1",
  blockId: "ckabcdef0000000000000abc2",
  order: 0,
  label: "Warmup",
  archetypeKind: "COUNT_DOWN",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
  schemeTemplateId: null,
  restConfig: null,
  version: 1,
  ...overrides,
});

describe("BlockSegmentEditor", () => {
  it("renders label, order and archetype select", () => {
    render(<BlockSegmentEditor segment={buildSegment()} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/label/i)).toHaveValue("Warmup");
    expect(screen.getByLabelText(/order/i)).toHaveValue(0);
    expect(screen.getByLabelText(/archetype/i)).toBeInTheDocument();
  });

  it("dispatches label change", () => {
    const onChange = vi.fn<(next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void>();

    render(<BlockSegmentEditor segment={buildSegment()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: "Strength" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    expect(updater(buildSegment()).label).toBe("Strength");
  });

  it("dispatches null label when input is cleared", () => {
    const onChange = vi.fn<(next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void>();

    render(<BlockSegmentEditor segment={buildSegment()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: "" } });

    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    expect(updater(buildSegment()).label).toBeNull();
  });

  it("resets schemeParams when archetype changes", () => {
    const onChange = vi.fn<(next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => void>();

    render(<BlockSegmentEditor segment={buildSegment()} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByLabelText(/archetype/i));
    fireEvent.click(screen.getByRole("option", { name: /EMOM LOOP/i }));

    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    const next = updater(buildSegment());

    expect(next.archetypeKind).toBe("EMOM_LOOP");
    expect(next.schemeParams.kind).toBe("EMOM_LOOP");
    expect(next.schemeTemplateId).toBeNull();
  });
});
