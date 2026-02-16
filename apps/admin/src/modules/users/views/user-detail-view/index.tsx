"use client";

import { type AdminUser } from "@repo/contracts/user";
import { ContentSection } from "@repo/ui";

import { useUser } from "@app/lib/hooks";

import { UserDetailSection } from "../../sections";

interface UserDetailViewProps {
  initialData: AdminUser;
}

export const UserDetailView = ({ initialData }: UserDetailViewProps) => {
  const { data: user } = useUser(initialData.id, initialData);

  if (!user) {
    return null;
  }

  return (
    <ContentSection
      title="User Details"
      subtitle={user.email}
      backHref="/users"
      backLabel="Back to Users"
    >
      <UserDetailSection user={user} />
    </ContentSection>
  );
};
