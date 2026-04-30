"use client";

import { QueryWrapper } from "@repo/ui";

import { useSessionTemplate } from "@app/lib/hooks";

import { SessionTemplateDetailForm } from "./session-template-detail-form";

type SessionTemplateLibraryDetailViewProps = {
  id: string;
};

export const SessionTemplateLibraryDetailView: React.FC<SessionTemplateLibraryDetailViewProps> = ({
  id,
}) => {
  const { data, isLoading, error } = useSessionTemplate(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading session template..."
    >
      {(sessionTemplate) => <SessionTemplateDetailForm sessionTemplate={sessionTemplate} />}
    </QueryWrapper>
  );
};
