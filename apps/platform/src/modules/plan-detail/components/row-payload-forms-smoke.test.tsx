import { screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { RestRowPayloadForm, restDefaultValue } from "./rest-row-payload-form";
import { RestSlotRowPayloadForm, restSlotDefaultValue } from "./rest-slot-row-payload-form";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { PlaceholderRowPayloadForm, placeholderDefaultValue } = await import(
  "./placeholder-row-payload-form"
);

const onChange: Mock = vi.fn();

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("RestRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the rest value, a raw textbox and a notes textbox without calling onChange on mount", () => {
    render(<RestRowPayloadForm value={restDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Rest value" })).toHaveValue(90);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("RestSlotRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows only a notes textbox without calling onChange on mount", () => {
    render(<RestSlotRowPayloadForm value={restSlotDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PlaceholderRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the kind toggle and an add per-set affordance without calling onChange on mount", () => {
    render(<PlaceholderRowPayloadForm value={placeholderDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("group", { name: "kind" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add per-set substitutions" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
