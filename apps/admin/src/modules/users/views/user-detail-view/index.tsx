"use client";

import { useEffect } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { type UserRole } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { ContentSection } from "@repo/ui";

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

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (user) {
      reset({ role: user.role as UserRole });
    }
  }, [user, reset]);

  if (!user) {
    return null;
  }

  const onSubmit = (data: { role: UserRole }) => {
    updateRole({ id: user.id, data: { role: data.role } });
  };

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="User Details"
        subtitle={user.email}
        backHref="/users"
        backLabel="Back to Users"
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit(onSubmit),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <UserDetailSection user={user} isPending={isPending} />
      </ContentSection>
    </FormProvider>
  );
};
