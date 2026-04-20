"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import { updateUserSchema, type UpdateUserData } from "@repo/contracts/iam/user";
import { FormView, QueryWrapper } from "@repo/ui";

import { useUpdateUser, useUser } from "@app/lib/hooks";

import { UserDetailSection } from "../../sections";

type UserDetailFormProps = {
  user: AdminUserView;
};

const UserDetailForm: React.FC<UserDetailFormProps> = ({ user }) => {
  const { mutate: updateUser, isPending } = useUpdateUser();

  const methods = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      role: user.role,
      timezone: user.timezone,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateUser({ id: user.id, data })}
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
