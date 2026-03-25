"use client";

import { useForm } from "react-hook-form";

import { type UserRole } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { QueryWrapper } from "@repo/query";
import { FormView } from "@repo/ui";

import { useUpdateUserRole, useUser } from "@app/lib/hooks";

import { UserDetailSection } from "../../sections";

type UserDetailFormProps = {
  user: AdminUser;
};

const UserDetailForm: React.FC<UserDetailFormProps> = ({ user }) => {
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  const methods = useForm<{ role: UserRole }>({
    defaultValues: {
      role: user.role,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateRole({ id: user.id, data: { role: data.role } })}
      isPending={isPending}
      title="User Details"
      subtitle={user.email}
      backHref="/users"
      backLabel="Back to Users"
    >
      <UserDetailSection user={user} isPending={isPending} />
    </FormView>
  );
};

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
