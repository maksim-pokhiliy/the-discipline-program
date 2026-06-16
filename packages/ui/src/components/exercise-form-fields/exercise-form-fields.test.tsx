import { type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, screen, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { type z } from "zod";

import { createExerciseSchema } from "@repo/contracts/lms/exercise";

import { render } from "../../test/render";

import { ExerciseFormFields, type ExerciseFormFieldsProps } from "./exercise-form-fields";

type FormInput = z.input<typeof createExerciseSchema>;
type FormOutput = z.output<typeof createExerciseSchema>;

type HarnessProps = {
  defaultValues?: Partial<FormInput> | undefined;
  fieldProps?: ExerciseFormFieldsProps | undefined;
};

const Harness = ({ defaultValues, fieldProps }: HarnessProps): ReactElement => {
  const methods = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      canonicalName: "",
      nature: "CONCRETE",
      defaultDemoUrls: [],
      aliases: [],
      notes: null,
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <ExerciseFormFields {...fieldProps} />
    </FormProvider>
  );
};

describe("ExerciseFormFields", () => {
  it("renders the five survivor fields", () => {
    render(<Harness />);

    expect(screen.getByLabelText(/Canonical Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Default Demo URLs")).toBeInTheDocument();
    expect(screen.getByLabelText("Aliases")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    expect(screen.getAllByText("Nature").length).toBeGreaterThan(0);
    expect(screen.getByRole("combobox")).toHaveTextContent("Concrete");
  });

  it("does not render a movement family field", () => {
    render(<Harness />);

    expect(screen.queryByLabelText(/Movement Family/i)).not.toBeInTheDocument();
  });

  it("exposes the three nature options", () => {
    render(<Harness />);

    fireEvent.mouseDown(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByText("Concrete")).toBeInTheDocument();
    expect(within(listbox).getByText("Placeholder")).toBeInTheDocument();
    expect(within(listbox).getByText("Rest")).toBeInTheDocument();
  });

  it("pushes a tag into a TagsInput on Enter", () => {
    render(<Harness />);

    const aliasInput = screen.getByLabelText("Aliases");

    fireEvent.change(aliasInput, { target: { value: "Air Squat" } });
    fireEvent.keyDown(aliasInput, { key: "Enter" });

    expect(screen.getByText("Air Squat")).toBeInTheDocument();
  });

  it("seeds the canonical name field from default values", () => {
    render(<Harness defaultValues={{ canonicalName: "Sled Push" }} />);

    expect(screen.getByLabelText(/Canonical Name/i)).toHaveValue("Sled Push");
  });

  it("disables fields when isLoading", () => {
    render(<Harness fieldProps={{ isLoading: true }} />);

    expect(screen.getByLabelText(/Canonical Name/i)).toBeDisabled();
    expect(screen.getByLabelText("Notes")).toBeDisabled();
  });
});
