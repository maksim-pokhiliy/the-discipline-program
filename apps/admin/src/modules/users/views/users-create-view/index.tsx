"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { UserRole } from "@repo/contracts/iam/auth";
import { createUserSchema, type CreateUserData } from "@repo/contracts/iam/user";
import { baseEnv } from "@repo/env/base";
import { FormView } from "@repo/ui";

import { useCreateUser } from "@app/lib/hooks";

import { UserForm } from "../../components";

const INVITE_DISABLED_MESSAGE =
  "Email delivery is disabled. The user will be created without an invite email.";

type CreateUserInput = z.input<typeof createUserSchema>;

export const UsersCreateView = () => {
  const { mutate: createUser, isPending } = useCreateUser();
  const isInviteEnabled = baseEnv.NEXT_PUBLIC_FEATURE_USER_INVITE_ENABLED;

  const methods = useForm<CreateUserInput, unknown, CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: "",
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
        {!isInviteEnabled && <Alert severity="info">{INVITE_DISABLED_MESSAGE}</Alert>}
        <UserForm isLoading={isPending} />
      </Stack>
    </FormView>
  );
};
