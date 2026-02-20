"use client";

import { useForm } from "react-hook-form";

import { type UserRole } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { FormView } from "@repo/ui";

import { useUpdateUserRole, useUser } from "@app/lib/hooks";

import { UserDetailSection } from "../../sections";

interface UserDetailViewProps {
  initialData: AdminUser;
}

export const UserDetailView = ({ initialData }: UserDetailViewProps) => {
  const { data: user } = useUser(initialData.id, initialData);
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  const methods = useForm<{ role: UserRole }>({
    values: {
      role: user?.role ?? initialData.role,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateRole({ id: user.id, data: { role: data.role } })}
      isPending={isPending}
      title="User Details"
      subtitle={user.email}
      backHref="/users"
      backLabel="Back to Users"
      backgroundColor="dark"
    >
      <UserDetailSection user={user} isPending={isPending} />
    </FormView>
  );
};
