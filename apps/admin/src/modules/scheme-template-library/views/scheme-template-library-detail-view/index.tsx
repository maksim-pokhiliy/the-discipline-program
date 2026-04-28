"use client";

import { QueryWrapper } from "@repo/ui";

import { useSchemeTemplate } from "@app/lib/hooks";

import { SchemeTemplateDetailForm } from "./scheme-template-detail-form";

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
