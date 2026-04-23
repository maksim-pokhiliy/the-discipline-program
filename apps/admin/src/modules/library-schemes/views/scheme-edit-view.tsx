"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateSchemeSchema,
  type Scheme,
  type UpdateSchemeData,
} from "@repo/contracts/library/scheme";
import { FormView, QueryWrapper } from "@repo/ui";

import { useLibraryScheme, useUpdateLibraryScheme } from "@app/lib/hooks";

import { parseParamDefaults, SchemeForm, stringifyParamDefaults } from "../components";

type SchemeEditFormProps = {
  scheme: Scheme;
};

const SchemeEditForm = ({ scheme }: SchemeEditFormProps) => {
  const { mutate: updateScheme, isPending } = useUpdateLibraryScheme();
  const [paramDefaultsText, setParamDefaultsText] = useState(
    stringifyParamDefaults(scheme.paramDefaults),
  );
  const [paramDefaultsError, setParamDefaultsError] = useState<string | undefined>(undefined);

  const methods = useForm<UpdateSchemeData>({
    resolver: zodResolver(updateSchemeSchema),
    defaultValues: {
      slug: scheme.slug,
      name: scheme.name,
      kind: scheme.kind,
      description: scheme.description ?? undefined,
      requiredParams: scheme.requiredParams,
      paramDefaults: scheme.paramDefaults,
      active: scheme.active,
      sortOrder: scheme.sortOrder,
    },
  });

  const handleSubmit = (data: UpdateSchemeData) => {
    const parsed = parseParamDefaults(paramDefaultsText);

    if (!parsed.ok) {
      setParamDefaultsError(parsed.error);

      return;
    }

    setParamDefaultsError(undefined);
    updateScheme({ id: scheme.id, data: { ...data, paramDefaults: parsed.value } });
  };

  return (
    <FormView
      methods={methods}
      onSubmit={handleSubmit}
      isPending={isPending}
      title="Edit Scheme"
      subtitle={scheme.name}
      backHref="/library/schemes"
      backLabel="Back to Schemes"
    >
      <SchemeForm
        isEdit
        isLoading={isPending}
        paramDefaultsText={paramDefaultsText}
        onParamDefaultsTextChange={(next) => {
          setParamDefaultsText(next);
          setParamDefaultsError(undefined);
        }}
        paramDefaultsError={paramDefaultsError}
      />
    </FormView>
  );
};

type SchemeEditViewProps = {
  id: string;
};

export const SchemeEditView = ({ id }: SchemeEditViewProps) => {
  const { data, isLoading, error } = useLibraryScheme(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading scheme..."
    >
      {(scheme) => <SchemeEditForm scheme={scheme} />}
    </QueryWrapper>
  );
};
