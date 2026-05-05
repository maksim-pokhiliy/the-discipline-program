"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createDayTypeSchema, type CreateDayTypeData } from "@repo/contracts/lms/day-type";
import { FormView } from "@repo/ui";

import { useCreateDayType } from "@app/lib/hooks";

import { DayTypeForm } from "../../components";

const DEFAULT_DAY_COLOR = "#1976d2";

type CreateDayTypeInput = z.input<typeof createDayTypeSchema>;

export const DayTypesCreateView = () => {
  const { mutate: createDayType, isPending } = useCreateDayType();

  const methods = useForm<CreateDayTypeInput, unknown, CreateDayTypeData>({
    resolver: zodResolver(createDayTypeSchema),
    defaultValues: {
      name: "",
      color: DEFAULT_DAY_COLOR,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createDayType(data)}
      isPending={isPending}
      title="Create Day Type"
      subtitle="Add a new day category to the library"
      backHref="/day-types"
      backLabel="Back to List"
      submitLabel="Create Day Type"
    >
      <DayTypeForm isLoading={isPending} />
    </FormView>
  );
};
