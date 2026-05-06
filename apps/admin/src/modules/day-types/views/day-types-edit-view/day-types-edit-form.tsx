"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createDayTypeSchema,
  type CreateDayTypeData,
  type DayType,
} from "@repo/contracts/lms/day-type";
import { FormView } from "@repo/ui";

import { useUpdateDayType } from "@app/lib/hooks";

import { DayTypeForm } from "../../components";

type CreateDayTypeInput = z.input<typeof createDayTypeSchema>;

type DayTypesEditFormProps = {
  dayType: DayType;
};

export const DayTypesEditForm: React.FC<DayTypesEditFormProps> = ({ dayType }) => {
  const { mutate: updateDayType, isPending } = useUpdateDayType();

  const methods = useForm<CreateDayTypeInput, unknown, CreateDayTypeData>({
    resolver: zodResolver(createDayTypeSchema),
    defaultValues: {
      name: dayType.name,
      color: dayType.color,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateDayType({ id: dayType.id, data })}
      isPending={isPending}
      title="Edit Day Type"
      subtitle={dayType.name}
      backHref="/day-types"
      backLabel="Back to List"
    >
      <DayTypeForm isLoading={isPending} />
    </FormView>
  );
};
