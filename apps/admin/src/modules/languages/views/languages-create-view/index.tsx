"use client";

import { type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createLocaleRequestSchema, type CreateLocaleRequest } from "@repo/contracts/cms/locale";
import { notifyError } from "@repo/query";
import { FormView } from "@repo/ui";

import { useCreateLocale } from "@app/lib/hooks";

import { codeFieldErrorOf, LanguageCreateForm } from "../../components";
import { LANGUAGES_PATH } from "../../constants";

type CreateLocaleInput = z.input<typeof createLocaleRequestSchema>;

export const LanguagesCreateView = (): ReactElement => {
  const { mutate: createLocale, isPending } = useCreateLocale();
  const methods = useForm<CreateLocaleInput, unknown, CreateLocaleRequest>({
    resolver: zodResolver(createLocaleRequestSchema),
    defaultValues: { code: "", name: "" },
  });
  const onError = (error: Error): void => {
    const message = codeFieldErrorOf(error);

    if (message !== null) {
      methods.setError("code", { type: "server", message });

      return;
    }

    notifyError(error, "Failed to create language");
  };

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createLocale(data, { onError })}
      isPending={isPending}
      title="Create Language"
      subtitle="Add a language the site can be translated into"
      backHref={LANGUAGES_PATH}
      backLabel="Back to languages"
      submitLabel="Create"
    >
      <LanguageCreateForm isPending={isPending} />
    </FormView>
  );
};
