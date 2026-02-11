"use client";

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

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading contacts..."
    >
      {(data) => (
        <Stack>
          <ContactsStatsSection stats={data.stats} />
          <ContactsListSection contacts={data.contacts} stats={data.stats} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
