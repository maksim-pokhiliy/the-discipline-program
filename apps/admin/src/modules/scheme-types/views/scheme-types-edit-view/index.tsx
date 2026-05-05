"use client";

import { QueryWrapper } from "@repo/ui";

import { useSchemeType } from "@app/lib/hooks";

import { SchemeTypesEditForm } from "./scheme-types-edit-form";

type SchemeTypesEditViewProps = {
  id: string;
};

export const SchemeTypesEditView: React.FC<SchemeTypesEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useSchemeType(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading scheme type..."
    >
      {(schemeType) => <SchemeTypesEditForm schemeType={schemeType} />}
    </QueryWrapper>
  );
};
