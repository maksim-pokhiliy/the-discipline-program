"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createSchemeTypeSchema, type CreateSchemeTypeData } from "@repo/contracts/lms/scheme-type";
import { FormView } from "@repo/ui";

import { useCreateSchemeType } from "@app/lib/hooks";

import { SchemeTypeForm } from "../../components";

type CreateSchemeTypeInput = z.input<typeof createSchemeTypeSchema>;

export const SchemeTypesCreateView = () => {
  const { mutate: createSchemeType, isPending } = useCreateSchemeType();

  const methods = useForm<CreateSchemeTypeInput, unknown, CreateSchemeTypeData>({
    resolver: zodResolver(createSchemeTypeSchema),
    defaultValues: {
      name: "",
      archetypeKind: "NONE",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createSchemeType(data)}
      isPending={isPending}
      title="Create Scheme Type"
      subtitle="Add a new scheme archetype to the library"
      backHref="/scheme-types"
      backLabel="Back to List"
      submitLabel="Create Scheme Type"
    >
      <SchemeTypeForm isLoading={isPending} />
    </FormView>
  );
};
