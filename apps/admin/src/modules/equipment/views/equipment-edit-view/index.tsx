"use client";

import { QueryWrapper } from "@repo/ui";

import { useEquipmentItem } from "@app/lib/hooks";

import { EquipmentEditForm } from "./equipment-edit-form";

type EquipmentEditViewProps = {
  id: string;
};

export const EquipmentEditView: React.FC<EquipmentEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useEquipmentItem(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading equipment..."
    >
      {(equipment) => <EquipmentEditForm equipment={equipment} />}
    </QueryWrapper>
  );
};
