"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createSchemeSchema,
  SchemeKind,
  type CreateSchemeData,
} from "@repo/contracts/library/scheme";
import { FormView } from "@repo/ui";

import { useCreateLibraryScheme } from "@app/lib/hooks";

import { parseParamDefaults, SchemeForm, stringifyParamDefaults } from "../components";

type CreateSchemeInput = z.input<typeof createSchemeSchema>;

export const SchemeCreateView = () => {
  const { mutate: createScheme, isPending } = useCreateLibraryScheme();
  const [paramDefaultsText, setParamDefaultsText] = useState(stringifyParamDefaults({}));
  const [paramDefaultsError, setParamDefaultsError] = useState<string | undefined>(undefined);

  const methods = useForm<CreateSchemeInput, unknown, CreateSchemeData>({
    resolver: zodResolver(createSchemeSchema),
    defaultValues: {
      slug: "",
      name: "",
      kind: SchemeKind.STRAIGHT_SETS,
      description: undefined,
      requiredParams: [],
      paramDefaults: {},
      active: true,
      sortOrder: 0,
    },
  });

  const handleSubmit = (data: CreateSchemeData) => {
    const parsed = parseParamDefaults(paramDefaultsText);

    if (!parsed.ok) {
      setParamDefaultsError(parsed.error);

      return;
    }

    setParamDefaultsError(undefined);
    createScheme({ ...data, paramDefaults: parsed.value });
  };

  return (
    <FormView
      methods={methods}
      onSubmit={handleSubmit}
      isPending={isPending}
      title="Create Scheme"
      subtitle="Add a new programming scheme"
      backHref="/library/schemes"
      backLabel="Back to Schemes"
      submitLabel="Create Scheme"
    >
      <SchemeForm
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
