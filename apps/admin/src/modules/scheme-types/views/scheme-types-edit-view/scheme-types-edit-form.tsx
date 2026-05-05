"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { defaultSchemeParams } from "@repo/contracts/lms/_domain";
import {
  createSchemeTypeSchema,
  type CreateSchemeTypeData,
  type SchemeType,
} from "@repo/contracts/lms/scheme-type";
import { FormView } from "@repo/ui";

import { useUpdateSchemeType } from "@app/lib/hooks";

import { SchemeTypeForm } from "../../components";

type CreateSchemeTypeInput = z.input<typeof createSchemeTypeSchema>;

type SchemeTypesEditFormProps = {
  schemeType: SchemeType;
};

export const SchemeTypesEditForm: React.FC<SchemeTypesEditFormProps> = ({ schemeType }) => {
  const { mutate: updateSchemeType, isPending } = useUpdateSchemeType();

  const methods = useForm<CreateSchemeTypeInput, unknown, CreateSchemeTypeData>({
    resolver: zodResolver(createSchemeTypeSchema),
    defaultValues: {
      name: schemeType.name,
      archetypeKind: schemeType.archetypeKind,
      defaultParams: schemeType.defaultParams ?? defaultSchemeParams(schemeType.archetypeKind),
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateSchemeType({ id: schemeType.id, data })}
      isPending={isPending}
      title="Edit Scheme Type"
      subtitle={schemeType.name}
      backHref="/scheme-types"
      backLabel="Back to List"
    >
      <SchemeTypeForm isLoading={isPending} />
    </FormView>
  );
};
