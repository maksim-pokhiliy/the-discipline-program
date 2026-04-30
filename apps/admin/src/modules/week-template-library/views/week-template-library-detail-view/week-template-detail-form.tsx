"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  updateWeekTemplateInputSchema,
  type UpdateWeekTemplateInput,
  type WeekTemplate,
} from "@repo/contracts/lms/week-template";
import { FormView } from "@repo/ui";

import { useUpdateWeekTemplate } from "@app/lib/hooks";

import { WeekTemplateLibraryDetailSection } from "../../sections";

type FormInput = z.input<typeof updateWeekTemplateInputSchema>;

type WeekTemplateDetailFormProps = {
  weekTemplate: WeekTemplate;
};

export const WeekTemplateDetailForm: React.FC<WeekTemplateDetailFormProps> = ({ weekTemplate }) => {
  const { mutate: updateWeekTemplate, isPending } = useUpdateWeekTemplate();

  const methods = useForm<FormInput, unknown, UpdateWeekTemplateInput>({
    resolver: zodResolver(updateWeekTemplateInputSchema),
    defaultValues: {
      name: weekTemplate.name,
      description: weekTemplate.description ?? undefined,
      scope: weekTemplate.scope,
      ownerId: weekTemplate.ownerId,
      payload: weekTemplate.payload as FormInput["payload"],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateWeekTemplate({ id: weekTemplate.id, data })}
      isPending={isPending}
      title="Edit week template"
      subtitle={weekTemplate.name}
      backHref="/library/week-templates"
      backLabel="Back to Week templates"
    >
      <WeekTemplateLibraryDetailSection weekTemplate={weekTemplate} isPending={isPending} />
    </FormView>
  );
};
