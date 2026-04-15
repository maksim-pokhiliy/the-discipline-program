"use client";

import { type UseQueryResult } from "@tanstack/react-query";

import { ContentSection, QueryWrapper } from "@repo/ui";

type AdminListViewProps<TData> = {
  queryResult: UseQueryResult<TData, Error>;
  loadingMessage: string;
  title?: string;
  subtitle?: string;
  children: (data: TData) => React.ReactNode;
};

export const AdminListView = <TData,>({
  queryResult,
  loadingMessage,
  title,
  subtitle,
  children,
}: AdminListViewProps<TData>) => {
  const { data, isLoading, error } = queryResult;

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage={loadingMessage}>
      {(resolvedData) => (
        <ContentSection
          maxWidth="xl"
          title={title}
          subtitle={subtitle}
          textAlign="left"
          animated={false}
        >
          {children(resolvedData)}
        </ContentSection>
      )}
    </QueryWrapper>
  );
};
