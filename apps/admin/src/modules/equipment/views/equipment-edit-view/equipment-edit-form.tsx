"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createEquipmentSchema,
  type CreateEquipmentData,
  type Equipment,
} from "@repo/contracts/lms/equipment";
import { FormView } from "@repo/ui";

import { useUpdateEquipment } from "@app/lib/hooks";

import { EquipmentForm } from "../../components";

type CreateEquipmentInput = z.input<typeof createEquipmentSchema>;

type EquipmentEditFormProps = {
  equipment: Equipment;
};

export const EquipmentEditForm: React.FC<EquipmentEditFormProps> = ({ equipment }) => {
  const { mutate: updateEquipment, isPending } = useUpdateEquipment();

  const methods = useForm<CreateEquipmentInput, unknown, CreateEquipmentData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      name: equipment.name,
      notes: equipment.notes,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateEquipment({ id: equipment.id, data })}
      isPending={isPending}
      title="Edit Equipment"
      subtitle={equipment.name}
      backHref="/equipment"
      backLabel="Back to equipment"
      submitLabel="Save changes"
    >
      <EquipmentForm isLoading={isPending} />
    </FormView>
  );
};
