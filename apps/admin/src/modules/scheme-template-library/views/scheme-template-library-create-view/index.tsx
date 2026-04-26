"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createSchemeTemplateInputSchema,
  type CreateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormView } from "@repo/ui";

import { useCreateSchemeTemplate } from "@app/lib/hooks";

import { SchemeTemplateLibraryForm } from "../../components";
import { DEFAULT_PARAMS_TEMPLATES } from "../../constants";

type CreateInput = z.input<typeof createSchemeTemplateInputSchema>;

export const SchemeTemplateLibraryCreateView = () => {
  const { mutate: createSchemeTemplate, isPending } = useCreateSchemeTemplate();

  const methods = useForm<CreateInput, unknown, CreateSchemeTemplateInput>({
    resolver: zodResolver(createSchemeTemplateInputSchema),
    defaultValues: {
      scope: "COACH",
      name: "",
      description: undefined,
      archetypeKind: "NONE",
      defaultParams: DEFAULT_PARAMS_TEMPLATES.NONE as CreateInput["defaultParams"],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createSchemeTemplate(data)}
      isPending={isPending}
      title="Create scheme template"
      subtitle="Add a new entry to the scheme template library"
      backHref="/library/scheme-templates"
      backLabel="Back to Scheme templates"
      submitLabel="Create scheme template"
    >
      <SchemeTemplateLibraryForm isLoading={isPending} />
    </FormView>
  );
};
