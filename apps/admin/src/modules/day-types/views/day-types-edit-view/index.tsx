"use client";

import { QueryWrapper } from "@repo/ui";

import { useDayType } from "@app/lib/hooks";

import { DayTypesEditForm } from "./day-types-edit-form";

type DayTypesEditViewProps = {
  id: string;
};

export const DayTypesEditView: React.FC<DayTypesEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useDayType(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading day type..."
    >
      {(dayType) => <DayTypesEditForm dayType={dayType} />}
    </QueryWrapper>
  );
};
