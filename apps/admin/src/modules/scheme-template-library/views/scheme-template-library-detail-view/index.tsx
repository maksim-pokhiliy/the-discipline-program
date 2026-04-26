"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateSchemeTemplateInputSchema,
  type SchemeTemplate,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormView, QueryWrapper } from "@repo/ui";

import { useSchemeTemplate, useUpdateSchemeTemplate } from "@app/lib/hooks";

import { SchemeTemplateLibraryDetailSection } from "../../sections";

type SchemeTemplateDetailFormProps = {
  schemeTemplate: SchemeTemplate;
};

const SchemeTemplateDetailForm: React.FC<SchemeTemplateDetailFormProps> = ({ schemeTemplate }) => {
  const { mutate: updateSchemeTemplate, isPending } = useUpdateSchemeTemplate();

  const methods = useForm<UpdateSchemeTemplateInput>({
    resolver: zodResolver(updateSchemeTemplateInputSchema),
    defaultValues: {
      name: schemeTemplate.name,
      description: schemeTemplate.description ?? undefined,
      archetypeKind: schemeTemplate.archetypeKind,
      defaultParams: schemeTemplate.defaultParams,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateSchemeTemplate({ id: schemeTemplate.id, data })}
      isPending={isPending}
      title="Edit scheme template"
      subtitle={schemeTemplate.name}
      backHref="/library/scheme-templates"
      backLabel="Back to Scheme templates"
    >
      <SchemeTemplateLibraryDetailSection schemeTemplate={schemeTemplate} isPending={isPending} />
    </FormView>
  );
};

type SchemeTemplateLibraryDetailViewProps = {
  id: string;
};

export const SchemeTemplateLibraryDetailView: React.FC<SchemeTemplateLibraryDetailViewProps> = ({
  id,
}) => {
  const { data, isLoading, error } = useSchemeTemplate(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading scheme template..."
    >
      {(schemeTemplate) => <SchemeTemplateDetailForm schemeTemplate={schemeTemplate} />}
    </QueryWrapper>
  );
};
