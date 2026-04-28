"use client";

import { QueryWrapper } from "@repo/ui";

import { useUser } from "@app/lib/hooks";

import { UserDetailForm } from "./user-detail-form";

type UserDetailViewProps = {
  id: string;
};

export const UserDetailView: React.FC<UserDetailViewProps> = ({ id }) => {
  const { data, isLoading, error } = useUser(id);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading user...">
      {(user) => <UserDetailForm user={user} />}
    </QueryWrapper>
  );
};
