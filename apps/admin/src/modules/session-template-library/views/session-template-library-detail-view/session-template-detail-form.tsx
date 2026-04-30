"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  updateSessionTemplateInputSchema,
  type SessionTemplate,
  type UpdateSessionTemplateInput,
} from "@repo/contracts/lms/session-template";
import { FormView } from "@repo/ui";

import { useUpdateSessionTemplate } from "@app/lib/hooks";

import { SessionTemplateLibraryDetailSection } from "../../sections";

type FormInput = z.input<typeof updateSessionTemplateInputSchema>;

type SessionTemplateDetailFormProps = {
  sessionTemplate: SessionTemplate;
};

export const SessionTemplateDetailForm: React.FC<SessionTemplateDetailFormProps> = ({
  sessionTemplate,
}) => {
  const { mutate: updateSessionTemplate, isPending } = useUpdateSessionTemplate();

  const methods = useForm<FormInput, unknown, UpdateSessionTemplateInput>({
    resolver: zodResolver(updateSessionTemplateInputSchema),
    defaultValues: {
      name: sessionTemplate.name,
      description: sessionTemplate.description ?? undefined,
      scope: sessionTemplate.scope,
      ownerId: sessionTemplate.ownerId,
      payload: sessionTemplate.payload as FormInput["payload"],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateSessionTemplate({ id: sessionTemplate.id, data })}
      isPending={isPending}
      title="Edit session template"
      subtitle={sessionTemplate.name}
      backHref="/library/session-templates"
      backLabel="Back to Session templates"
    >
      <SessionTemplateLibraryDetailSection
        sessionTemplate={sessionTemplate}
        isPending={isPending}
      />
    </FormView>
  );
};
