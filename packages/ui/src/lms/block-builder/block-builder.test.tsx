import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";

import { render } from "../../test/render";

import { BlockBuilder } from "./index";

const buildBlock = (overrides: Partial<Block> = {}): Block => ({
  id: "ckabcdef0000000000000abc1",
  sessionId: "ckabcdef0000000000000abc2",
  order: 0,
  kindId: "ckabcdef0000000000000abc3",
  title: "Squat focus",
  status: "ACTIVE",
  weight: 5,
  notes: null,
  version: 1,
  ...overrides,
});

const buildKind = (overrides: Partial<BlockKind> = {}): BlockKind => ({
  id: "ckabcdef0000000000000abc3",
  scope: "SYSTEM",
  ownerId: null,
  name: "Strength",
  description: null,
  iconKey: null,
  defaultWeight: 5,
  defaultArchetypeKind: null,
  analyticsCategory: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe("BlockBuilder", () => {
  it("renders title, status, weight and notes", () => {
    render(<BlockBuilder block={buildBlock()} blockKinds={[buildKind()]} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue("Squat focus");
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
    expect(screen.getByText(/Weight \(5\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("dispatches title change", () => {
    const onChange = vi.fn<(next: Block | ((prev: Block) => Block)) => void>();

    render(<BlockBuilder block={buildBlock()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Pull focus" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    expect(updater(buildBlock()).title).toBe("Pull focus");
  });

  it("falls back to a free-text kindId field when no library is provided", () => {
    render(<BlockBuilder block={buildBlock()} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/block kind id/i)).toBeInTheDocument();
  });
});
