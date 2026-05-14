"use client";

import { QueryWrapper } from "@repo/ui";

import { useLabel } from "@app/lib/hooks";

import { LabelsEditForm } from "./labels-edit-form";

type LabelsEditViewProps = {
  id: string;
};

export const LabelsEditView: React.FC<LabelsEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useLabel(id);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading label...">
      {(label) => <LabelsEditForm label={label} />}
    </QueryWrapper>
  );
};
