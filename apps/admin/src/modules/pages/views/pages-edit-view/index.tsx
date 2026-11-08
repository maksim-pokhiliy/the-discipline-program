"use client";

import { Suspense } from "react";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { QueryWrapper } from "@repo/ui";

import { usePageDetails } from "@app/lib/hooks";

import { PagesEditForm } from "./pages-edit-form";

type PagesEditViewProps = {
  slug: string;
};

export const PagesEditView: React.FC<PagesEditViewProps> = ({ slug }) => {
  const { data, isLoading, error } = usePageDetails(slug, DEFAULT_LOCALE_CODE);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={data ? null : error}
      data={data}
      loadingMessage="Loading page..."
    >
      {(page) => (
        <Suspense>
          <PagesEditForm page={page} />
        </Suspense>
      )}
    </QueryWrapper>
  );
};
