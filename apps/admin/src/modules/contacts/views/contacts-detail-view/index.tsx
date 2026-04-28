"use client";

import { QueryWrapper } from "@repo/ui";

import { useContact } from "@app/lib/hooks";

import { ContactsDetailForm } from "./contacts-detail-form";

type ContactsDetailViewProps = {
  id: string;
};

export const ContactsDetailView: React.FC<ContactsDetailViewProps> = ({ id }) => {
  const { data, isLoading, error } = useContact(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading contact..."
    >
      {(contact) => <ContactsDetailForm contact={contact} />}
    </QueryWrapper>
  );
};
