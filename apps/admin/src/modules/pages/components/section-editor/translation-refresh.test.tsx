import { type ReactElement, useEffect } from "react";

import { screen } from "@testing-library/react";
import { FormProvider, type FormState, useFieldArray, useForm, useWatch } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { type z } from "zod";

import { type faqContentSchema } from "@repo/contracts/cms/pages";

import { typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { TranslationRefresh } from "./translation-refresh";

type FaqValues = z.infer<typeof faqContentSchema>;
type FaqRow = FaqValues["items"][number];
type FormSnapshot = Pick<FormState<FaqValues>, "isDirty" | "dirtyFields"> & {
  defaults: FaqValues;
  values: FaqValues;
};

const TYPED_B = "Unsaved answer B";
const makeFaqRow = (id: string, overrides: Partial<FaqRow> = {}): FaqRow => ({
  id,
  question: `Saved question ${id}`,
  answer: `Saved answer ${id}`,
  ...overrides,
});
const makeFaqSeed = (items: FaqRow[]): FaqValues => ({
  title: "Saved FAQ",
  subtitle: "Saved subtitle",
  items,
});
const makeRefreshSeeds = () => {
  const initial = makeFaqSeed(["a", "b", "c"].map((id) => makeFaqRow(id)));
  const b = makeFaqRow("b");
  const c = makeFaqRow("c", { question: "Changed question C" });
  const d = makeFaqRow("d", { question: "", answer: "" });
  const next = makeFaqSeed([b, c, d]);
  const saved = makeFaqSeed([{ ...b, answer: TYPED_B }, c, d]);

  return { initial, next, saved };
};

const TranslationForm = ({
  seed,
  commits,
}: {
  seed: FaqValues;
  commits: boolean[];
}): ReactElement => {
  const form = useForm<FaqValues>({ defaultValues: seed });
  const { fields } = useFieldArray({ control: form.control, name: "items" });
  const values = useWatch({ control: form.control });
  const { defaultValues: defaults, dirtyFields, isDirty } = form.formState;

  useEffect(() => {
    commits.push(isDirty);
  });

  return (
    <FormProvider {...form}>
      <TranslationRefresh section="faq:content" seed={seed} />
      <input aria-label="title" {...form.register("title")} />
      <input aria-label="subtitle" {...form.register("subtitle")} />
      {fields.map((field, index) => (
        <div key={field.id}>
          <input type="hidden" {...form.register(`items.${index}.id`)} />
          <input
            aria-label={`items.${index}.question`}
            {...form.register(`items.${index}.question`)}
          />
          <input aria-label={`items.${index}.answer`} {...form.register(`items.${index}.answer`)} />
        </div>
      ))}
      <output data-testid="form-state">
        {JSON.stringify({ isDirty, dirtyFields, defaults, values })}
      </output>
    </FormProvider>
  );
};

const expectFormState = (expected: FormSnapshot): void => {
  expect(screen.getByTestId("form-state").textContent).toBe(JSON.stringify(expected));
};

describe("TranslationRefresh", () => {
  it("marks only the retained word at its new row coordinate and clears it on a changed own-save seed", () => {
    const { initial, next, saved } = makeRefreshSeeds();
    const commits: boolean[] = [];
    const { rerender } = render(<TranslationForm seed={initial} commits={commits} />);

    expectFormState({ isDirty: false, dirtyFields: {}, defaults: initial, values: initial });
    typeInto("items.0.answer", "Unsaved answer A");
    typeInto("items.1.answer", TYPED_B);
    expectFormState({
      isDirty: true,
      dirtyFields: { items: [{ answer: true }, { answer: true }] },
      defaults: initial,
      values: makeFaqSeed([
        makeFaqRow("a", { answer: "Unsaved answer A" }),
        makeFaqRow("b", { answer: TYPED_B }),
        makeFaqRow("c"),
      ]),
    });
    commits.length = 0;
    rerender(<TranslationForm seed={next} commits={commits} />);

    expect(commits.length).toBeGreaterThan(0);
    expect(commits).not.toContain(false);

    expectFormState({
      isDirty: true,
      dirtyFields: { items: [{ answer: true }] },
      defaults: next,
      values: saved,
    });
    rerender(<TranslationForm seed={saved} commits={commits} />);

    expectFormState({ isDirty: false, dirtyFields: {}, defaults: saved, values: saved });
  });
});
