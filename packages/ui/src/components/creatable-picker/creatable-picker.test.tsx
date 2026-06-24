import { useState, type ReactElement, type ReactNode } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { CreatablePicker } from "./creatable-picker";
import { type CreatableOption } from "./creatable-picker.types";

const SQUAT: CreatableOption = { id: "ex-1", label: "Back Squat" };
const PRESS: CreatableOption = { id: "ex-2", label: "Press" };

const openListbox = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

const typeQuery = (text: string): void => {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });
};

const chipLabels = (): string[] =>
  screen.getAllByRole("button").flatMap((node) => {
    const label = node.querySelector(".MuiChip-label");

    return label?.textContent ? [label.textContent] : [];
  });

type SingleHarnessProps = {
  mode: "single";
  options: CreatableOption[];
  onCreateOption: (typedName: string) => Promise<CreatableOption | null>;
  onChange?: ((next: CreatableOption | null) => void) | undefined;
  initialValue?: CreatableOption | null;
  renderOption?: ((option: CreatableOption) => ReactNode) | undefined;
};

type MultiHarnessProps = {
  mode: "multi";
  options: CreatableOption[];
  onCreateOption: (typedName: string) => Promise<CreatableOption | null>;
  onChange?: ((next: CreatableOption[]) => void) | undefined;
  initialValue?: CreatableOption[];
  maxCount?: number | undefined;
};

type HarnessProps = SingleHarnessProps | MultiHarnessProps;

const Harness = (props: HarnessProps): ReactElement => {
  const [singleValue, setSingleValue] = useState<CreatableOption | null>(
    props.mode === "single" ? (props.initialValue ?? null) : null,
  );
  const [multiValue, setMultiValue] = useState<CreatableOption[]>(
    props.mode === "multi" ? (props.initialValue ?? []) : [],
  );
  const [inputValue, setInputValue] = useState("");

  if (props.mode === "multi") {
    return (
      <CreatablePicker
        multiple
        options={props.options}
        value={multiValue}
        onChange={(next) => {
          setMultiValue(next);
          props.onChange?.(next);
        }}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onCreateOption={props.onCreateOption}
        label="Modifiers"
        {...(props.maxCount !== undefined && { maxCount: props.maxCount })}
      />
    );
  }

  return (
    <CreatablePicker
      options={props.options}
      value={singleValue}
      onChange={(next) => {
        setSingleValue(next);
        props.onChange?.(next);
      }}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onCreateOption={props.onCreateOption}
      label="Exercise"
      {...(props.renderOption !== undefined && { renderOption: props.renderOption })}
    />
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CreatablePicker single mode", () => {
  it("renders the selected option label as the input value", () => {
    render(
      <Harness
        mode="single"
        options={[SQUAT, PRESS]}
        onCreateOption={vi.fn()}
        initialValue={SQUAT}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("Back Squat");
  });

  it("opens the option listbox on input focus without a prior click", () => {
    render(<Harness mode="single" options={[SQUAT, PRESS]} onCreateOption={vi.fn()} />);

    fireEvent.focus(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("Press")).toBeInTheDocument();
  });

  it("surfaces a Create option for a query with no exact match", () => {
    render(<Harness mode="single" options={[PRESS]} onCreateOption={vi.fn()} />);

    openListbox();
    typeQuery("Back Squat");

    expect(screen.getByText('Create "Back Squat"')).toBeInTheDocument();
  });

  it("suppresses the Create option when the query exactly matches an option (case-insensitive)", () => {
    render(<Harness mode="single" options={[SQUAT]} onCreateOption={vi.fn()} />);

    openListbox();
    typeQuery("back squat");

    expect(screen.queryByText(/^Create "/)).not.toBeInTheDocument();
  });

  it("selects an existing option without calling onCreateOption", () => {
    const onCreateOption = vi.fn();
    const onChange = vi.fn();

    render(
      <Harness
        mode="single"
        options={[SQUAT, PRESS]}
        onCreateOption={onCreateOption}
        onChange={onChange}
      />,
    );

    openListbox();
    fireEvent.click(screen.getByText("Press"));

    expect(onChange).toHaveBeenCalledWith(PRESS);
    expect(onCreateOption).not.toHaveBeenCalled();
  });

  it("calls onCreateOption and selects the minted option when Create is chosen", async () => {
    const minted: CreatableOption = { id: "ex-9", label: "Sled Push" };
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(minted);

    const onChange = vi.fn();

    render(
      <Harness
        mode="single"
        options={[PRESS]}
        onCreateOption={onCreateOption}
        onChange={onChange}
      />,
    );

    openListbox();
    typeQuery("Sled Push");
    fireEvent.click(screen.getByText('Create "Sled Push"'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(minted));
    expect(onCreateOption).toHaveBeenCalledWith("Sled Push");
  });

  it("keeps the selection unchanged when onCreateOption resolves null (mint tolerance)", async () => {
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(null);

    const onChange = vi.fn();

    render(
      <Harness
        mode="single"
        options={[PRESS]}
        onCreateOption={onCreateOption}
        onChange={onChange}
      />,
    );

    openListbox();
    typeQuery("Sled Push");
    fireEvent.click(screen.getByText('Create "Sled Push"'));

    await vi.waitFor(() => expect(onCreateOption).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("routes a freeSolo-committed name through the create path", async () => {
    const minted: CreatableOption = { id: "ex-10", label: "Tempo Squat" };
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(minted);

    const onChange = vi.fn();

    render(
      <Harness mode="single" options={[]} onCreateOption={onCreateOption} onChange={onChange} />,
    );

    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "Tempo Squat" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await vi.waitFor(() => expect(onCreateOption).toHaveBeenCalledWith("Tempo Squat"));
    expect(onChange).toHaveBeenCalledWith(minted);
  });

  it("renders a custom node for existing options while leaving the Create row default", () => {
    render(
      <Harness
        mode="single"
        options={[SQUAT]}
        onCreateOption={vi.fn()}
        renderOption={(option) => <span data-testid="custom-option">{`★ ${option.label}`}</span>}
      />,
    );

    openListbox();
    typeQuery("Back");

    expect(screen.getByTestId("custom-option")).toHaveTextContent("★ Back Squat");
    expect(screen.getByText('Create "Back"')).toBeInTheDocument();
    expect(screen.queryByText("Back Squat")).not.toBeInTheDocument();
  });
});

describe("CreatablePicker multi mode", () => {
  it("renders selected options as chips", () => {
    render(
      <Harness
        mode="multi"
        options={[SQUAT, PRESS]}
        onCreateOption={vi.fn()}
        initialValue={[SQUAT, PRESS]}
      />,
    );

    expect(chipLabels()).toEqual(["Back Squat", "Press"]);
  });

  it("mints and appends a new option when Create is chosen", async () => {
    const minted: CreatableOption = { id: "mod-9", label: "from sofa" };
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(minted);

    const onChange = vi.fn();

    render(
      <Harness
        mode="multi"
        options={[PRESS]}
        onCreateOption={onCreateOption}
        onChange={onChange}
        initialValue={[SQUAT]}
      />,
    );

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onCreateOption).toHaveBeenCalledWith("from sofa");
    expect(onChange).toHaveBeenCalledWith([SQUAT, minted]);
  });

  it("ignores a null mint result and keeps the existing selection (mint tolerance)", async () => {
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(null);

    const onChange = vi.fn();

    render(
      <Harness
        mode="multi"
        options={[]}
        onCreateOption={onCreateOption}
        onChange={onChange}
        initialValue={[SQUAT]}
      />,
    );

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(onCreateOption).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith([SQUAT]);
  });

  it("dedupes a minted option that collides with an already-selected id", async () => {
    const onCreateOption = vi.fn<(name: string) => Promise<CreatableOption | null>>();

    onCreateOption.mockResolvedValueOnce(SQUAT);

    const onChange = vi.fn();

    render(
      <Harness
        mode="multi"
        options={[]}
        onCreateOption={onCreateOption}
        onChange={onChange}
        initialValue={[SQUAT]}
      />,
    );

    openListbox();
    typeQuery("Back Squat extra");
    fireEvent.click(screen.getByText('Create "Back Squat extra"'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith([SQUAT]);
  });

  it("makes the input read-only and shows the cap helper at the limit", () => {
    render(
      <Harness
        mode="multi"
        options={[]}
        onCreateOption={vi.fn()}
        initialValue={[SQUAT, PRESS]}
        maxCount={2}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveAttribute("readonly");
    expect(screen.getByText("Up to 2 items")).toBeInTheDocument();
  });
});
