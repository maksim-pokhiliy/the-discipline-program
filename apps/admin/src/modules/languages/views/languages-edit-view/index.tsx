"use client";

import { type ReactElement } from "react";

import { QueryWrapper } from "@repo/ui";

import { useLocale } from "@app/lib/hooks";

import { LanguagesEditForm } from "./languages-edit-form";

type LanguagesEditViewProps = { code: string };

export const LanguagesEditView = ({ code }: LanguagesEditViewProps): ReactElement => {
  const { data, isLoading, error } = useLocale(code);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading language..."
      noDataMessage="Language not found"
    >
      {(language) => <LanguagesEditForm language={language} />}
    </QueryWrapper>
  );
};
