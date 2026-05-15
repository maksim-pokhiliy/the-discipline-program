"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createLabelSchema, type CreateLabelData } from "@repo/contracts/cms/label";
import { FormView } from "@repo/ui";

import { useCreateLabel } from "@app/lib/hooks";

import { LabelForm } from "../../components";

type CreateLabelInput = z.input<typeof createLabelSchema>;

export const LabelsCreateView = () => {
  const { mutate: createLabel, isPending } = useCreateLabel();

  const methods = useForm<CreateLabelInput, unknown, CreateLabelData>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: "",
      applicableLevels: [],
      notes: null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createLabel(data)}
      isPending={isPending}
      title="Create Label"
      subtitle="Add a label to the coach library"
      backHref="/labels"
      backLabel="Back to labels"
      submitLabel="Create"
    >
      <LabelForm isLoading={isPending} />
    </FormView>
  );
};
