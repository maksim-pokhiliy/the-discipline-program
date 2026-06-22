"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createProfileAxisSchema,
  type CreateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";
import { FormView } from "@repo/ui";

import { useCreateProfileAxis } from "@app/lib/hooks";

import { ProfileAxisForm } from "../../components";

type CreateProfileAxisInput = z.input<typeof createProfileAxisSchema>;

export const ProfileAxesCreateView = () => {
  const { mutate: createProfileAxis, isPending } = useCreateProfileAxis();

  const methods = useForm<CreateProfileAxisInput, unknown, CreateProfileAxisData>({
    resolver: zodResolver(createProfileAxisSchema),
    defaultValues: {
      key: "",
      label: "",
      values: [],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createProfileAxis(data)}
      isPending={isPending}
      title="Create Profile Axis"
      subtitle="Add an axis to the coach library"
      backHref="/profile-axes"
      backLabel="Back to profile axes"
      submitLabel="Create"
    >
      <ProfileAxisForm isLoading={isPending} />
    </FormView>
  );
};
