"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createLabelSchema, type CreateLabelData, type Label } from "@repo/contracts/cms/label";
import { FormView } from "@repo/ui";

import { useUpdateLabel } from "@app/lib/hooks";

import { LabelForm } from "../../components";

type CreateLabelInput = z.input<typeof createLabelSchema>;

type LabelsEditFormProps = {
  label: Label;
};

export const LabelsEditForm: React.FC<LabelsEditFormProps> = ({ label }) => {
  const { mutate: updateLabel, isPending } = useUpdateLabel();

  const methods = useForm<CreateLabelInput, unknown, CreateLabelData>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: label.name,
      applicableLevels: label.applicableLevels,
      notes: label.notes,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateLabel({ id: label.id, data })}
      isPending={isPending}
      title="Edit Label"
      subtitle={label.name}
      backHref="/labels"
      backLabel="Back to labels"
      submitLabel="Save changes"
    >
      <LabelForm isLoading={isPending} />
    </FormView>
  );
};
