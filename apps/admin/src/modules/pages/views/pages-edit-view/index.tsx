"use client";

import { Suspense } from "react";

import { QueryWrapper } from "@repo/ui";

import { usePageDetails } from "@app/lib/hooks";

import { PagesEditForm } from "./pages-edit-form";

type PagesEditViewProps = {
  slug: string;
};

export const PagesEditView: React.FC<PagesEditViewProps> = ({ slug }) => {
  const { data, isLoading, error } = usePageDetails(slug);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading page...">
      {(page) => (
        <Suspense>
          <PagesEditForm page={page} />
        </Suspense>
      )}
    </QueryWrapper>
  );
};
