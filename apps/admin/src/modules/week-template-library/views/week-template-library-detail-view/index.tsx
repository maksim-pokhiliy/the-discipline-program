"use client";

import { QueryWrapper } from "@repo/ui";

import { useWeekTemplate } from "@app/lib/hooks";

import { WeekTemplateDetailForm } from "./week-template-detail-form";

type WeekTemplateLibraryDetailViewProps = {
  id: string;
};

export const WeekTemplateLibraryDetailView: React.FC<WeekTemplateLibraryDetailViewProps> = ({
  id,
}) => {
  const { data, isLoading, error } = useWeekTemplate(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading week template..."
    >
      {(weekTemplate) => <WeekTemplateDetailForm weekTemplate={weekTemplate} />}
    </QueryWrapper>
  );
};
