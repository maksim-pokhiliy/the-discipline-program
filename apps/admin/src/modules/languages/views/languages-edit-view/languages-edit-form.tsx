"use client";

import { type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createLocaleRequestSchema, type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { FormView } from "@repo/ui";

import { useUpdateLocale } from "@app/lib/hooks";

import { LanguageEditFields } from "../../components";
import { LANGUAGES_PATH } from "../../constants";

const renameLanguageSchema = createLocaleRequestSchema.pick({ name: true });

type RenameLanguageInput = z.input<typeof renameLanguageSchema>;
type RenameLanguageData = z.infer<typeof renameLanguageSchema>;
type LanguagesEditFormProps = { language: AdminLocaleListItem };

export const LanguagesEditForm = ({ language }: LanguagesEditFormProps): ReactElement => {
  const { mutate: updateLocale, isPending } = useUpdateLocale();
  const methods = useForm<RenameLanguageInput, unknown, RenameLanguageData>({
    resolver: zodResolver(renameLanguageSchema),
    defaultValues: { name: language.name },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateLocale({ code: language.code, data })}
      isPending={isPending}
      title="Edit Language"
      subtitle={language.name}
      backHref={LANGUAGES_PATH}
      backLabel="Back to languages"
      submitLabel="Save changes"
    >
      <LanguageEditFields code={language.code} isPending={isPending} />
    </FormView>
  );
};
