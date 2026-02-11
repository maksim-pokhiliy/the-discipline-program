"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import { type AdminContactsPageData } from "@repo/contracts/contact";
import { QueryWrapper } from "@repo/query";

import { useContactsPageData } from "@app/lib/hooks";

import { ContactsListSection, ContactsStatsSection } from "../../sections";

interface ContactsListViewProps {
  initialData: AdminContactsPageData;
}

export const ContactsListView = ({ initialData }: ContactsListViewProps) => {
  const { data, isLoading, error } = useContactsPageData({ initialData });
  const [filter, setFilter] = useState<string | null>(null);

  const handleFilterChange = (key: string) => {
    setFilter((prev) => (prev === key ? null : key));
  };

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading contacts..."
    >
      {(data) => (
        <Stack>
          <ContactsStatsSection
            stats={data.stats}
            selectedFilter={filter}
            onFilterChange={handleFilterChange}
          />
          <ContactsListSection contacts={data.contacts} filter={filter} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
