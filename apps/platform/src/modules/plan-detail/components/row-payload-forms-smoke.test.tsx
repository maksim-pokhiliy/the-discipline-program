import { screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  InnerLadderMarkerRowPayloadForm,
  innerLadderMarkerDefaultValue,
} from "./inner-ladder-marker-row-payload-form";
import { RestRowPayloadForm, restDefaultValue } from "./rest-row-payload-form";
import { RestSlotRowPayloadForm, restSlotDefaultValue } from "./rest-slot-row-payload-form";
import {
  StandaloneLoadRowPayloadForm,
  standaloneLoadDefaultValue,
} from "./standalone-load-row-payload-form";
import {
  StandaloneUrlRowPayloadForm,
  standaloneUrlDefaultValue,
} from "./standalone-url-row-payload-form";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { FootnoteRowPayloadForm, footnoteDefaultValue } = await import(
  "./footnote-row-payload-form"
);
const { PlaceholderRowPayloadForm, placeholderDefaultValue } = await import(
  "./placeholder-row-payload-form"
);
const { RepDefinitionRowPayloadForm, repDefinitionDefaultValue } = await import(
  "./rep-definition-row-payload-form"
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

describe("StandaloneLoadRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the absolute load toggle pressed and a notes field without calling onChange on mount", () => {
    render(<StandaloneLoadRowPayloadForm value={standaloneLoadDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Absolute kg", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("Applies to all preceding rows")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("StandaloneUrlRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the Wrapped toggle pressed by default and a 2-button Applies-to group", () => {
    render(<StandaloneUrlRowPayloadForm value={standaloneUrlDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /wrapped/i, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous exercise row" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Whole schema" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("InnerLadderMarkerRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows a 21 step cell and an add-step affordance without calling onChange on mount", () => {
    render(
      <InnerLadderMarkerRowPayloadForm value={innerLadderMarkerDefaultValue} onChange={onChange} />,
    );

    expect(screen.getByDisplayValue("21")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add step" })).toBeInTheDocument();
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

describe("FootnoteRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the marker/target toggles and the content editor without calling onChange on mount", () => {
    render(<FootnoteRowPayloadForm value={footnoteDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("group", { name: "marker" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "target" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add element" })).toBeInTheDocument();
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

describe("RepDefinitionRowPayloadForm renders its seeded defaults (MT-15)", () => {
  it("shows the default total reps and an add element affordance without calling onChange on mount", () => {
    render(<RepDefinitionRowPayloadForm value={repDefinitionDefaultValue} onChange={onChange} />);

    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add element" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
