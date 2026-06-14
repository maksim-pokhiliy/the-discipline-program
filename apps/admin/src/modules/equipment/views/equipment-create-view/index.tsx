"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createEquipmentSchema, type CreateEquipmentData } from "@repo/contracts/lms/equipment";
import { FormView } from "@repo/ui";

import { useCreateEquipment } from "@app/lib/hooks";

import { EquipmentForm } from "../../components";

type CreateEquipmentInput = z.input<typeof createEquipmentSchema>;

export const EquipmentCreateView = () => {
  const { mutate: createEquipment, isPending } = useCreateEquipment();

  const methods = useForm<CreateEquipmentInput, unknown, CreateEquipmentData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      name: "",
      notes: null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createEquipment(data)}
      isPending={isPending}
      title="Create Equipment"
      subtitle="Add an implement to the coach library"
      backHref="/equipment"
      backLabel="Back to equipment"
      submitLabel="Create"
    >
      <EquipmentForm isLoading={isPending} />
    </FormView>
  );
};
