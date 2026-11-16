"use client";

import { type ReactElement } from "react";

import { QueryWrapper } from "@repo/ui";

import { usePageDetails } from "@app/lib/hooks";

import { type EditorLocale } from "../../components/locale-gate";

import { PagesEditForm } from "./pages-edit-form";

type PagesEditContentProps = { slug: string; locale: EditorLocale };

export const PagesEditContent = ({ slug, locale }: PagesEditContentProps): ReactElement => {
  const { data, isLoading, error } = usePageDetails(slug, locale.code);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={data ? null : error}
      data={data}
      loadingMessage="Loading page..."
    >
      {(page) => <PagesEditForm page={page} locale={locale} />}
    </QueryWrapper>
  );
};
