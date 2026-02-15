"use client";

import { Container } from "@mui/material";

import { type AdminPageListItem } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { usePagesListData } from "@app/lib/hooks/use-pages";

import { PagesListSection } from "../../sections/pages-list-section";

interface PagesListViewProps {
  initialData: AdminPageListItem[];
}

export const PagesListView = ({ initialData }: PagesListViewProps) => {
  const { data, isLoading, error } = usePagesListData({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading pages...">
      {(pages) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <PagesListSection pages={pages} />
        </Container>
      )}
    </QueryWrapper>
  );
};
