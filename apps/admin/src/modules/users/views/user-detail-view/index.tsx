"use client";

import { useEffect } from "react";

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
    defaultValues: {
      role: (user?.role ?? initialData.role) as UserRole,
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (user) {
      reset({ role: user.role as UserRole });
    }
  }, [user, reset]);

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
    >
      <UserDetailSection user={user} isPending={isPending} />
    </FormView>
  );
};
