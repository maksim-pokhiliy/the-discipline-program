"use client";

import { Container } from "@mui/material";

import { type AdminContactsPageData } from "@repo/contracts/contact";
import { QueryWrapper } from "@repo/query";

import { useContactsPageData } from "@app/lib/hooks";

import { ContactsListSection } from "../../sections";

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
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <ContactsListSection contacts={data.contacts} />
        </Container>
      )}
    </QueryWrapper>
  );
};
