"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { UserRole } from "@repo/contracts/iam/auth";
import { createUserSchema, type CreateUserData } from "@repo/contracts/iam/user";
import { FormView } from "@repo/ui";

import { useCreateUser } from "@app/lib/hooks";

import { UserForm } from "../../components";

type CreateUserInput = z.input<typeof createUserSchema>;

export const UsersCreateView = () => {
  const { mutate: createUser, isPending } = useCreateUser();

  const methods = useForm<CreateUserInput, unknown, CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: null,
      role: UserRole.USER,
      timezone: "UTC",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createUser(data)}
      isPending={isPending}
      title="Create User"
      subtitle="Invite a new user"
      backHref="/users"
      backLabel="Back to Users"
      submitLabel="Create User"
    >
      <Stack spacing={3}>
        <Alert severity="info">Email delivery will activate in Phase 1b.</Alert>
        <UserForm isLoading={isPending} />
      </Stack>
    </FormView>
  );
};
