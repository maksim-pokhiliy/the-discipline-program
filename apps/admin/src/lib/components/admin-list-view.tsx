"use client";

import { Container } from "@mui/material";
import { type UseQueryResult } from "@tanstack/react-query";

import { QueryWrapper } from "@repo/query";

interface AdminListViewProps<TData> {
  queryResult: UseQueryResult<TData, Error>;
  loadingMessage: string;
  children: (data: TData) => React.ReactNode;
}

export const AdminListView = <TData,>({
  queryResult,
  loadingMessage,
  children,
}: AdminListViewProps<TData>) => {
  const { data, isLoading, error } = queryResult;

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage={loadingMessage}>
      {(resolvedData) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children(resolvedData)}
        </Container>
      )}
    </QueryWrapper>
  );
};
