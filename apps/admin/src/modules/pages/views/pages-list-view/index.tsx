"use client";

import { type AdminPageListItem } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";
import { ContentSection } from "@repo/ui";

import { usePagesListData } from "@app/lib/hooks/use-pages";

import { PagesListSection } from "../../sections/pages-list-section";

interface PagesListViewProps {
  initialData: AdminPageListItem[];
}

export const PagesListView = ({ initialData }: PagesListViewProps) => {
  const { data, isLoading, error } = usePagesListData({ initialData });

  return (
    <ContentSection title="Marketing Pages" backgroundColor="dark">
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading pages..."
      >
        {(pages) => <PagesListSection pages={pages} />}
      </QueryWrapper>
    </ContentSection>
  );
};
