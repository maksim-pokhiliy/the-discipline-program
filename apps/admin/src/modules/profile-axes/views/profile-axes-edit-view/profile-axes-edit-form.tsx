"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createProfileAxisSchema,
  type CreateProfileAxisData,
  type ProfileAxis,
} from "@repo/contracts/coaching/profile-axis";
import { FormView } from "@repo/ui";

import { useUpdateProfileAxis } from "@app/lib/hooks";

import { ProfileAxisForm } from "../../components";

type CreateProfileAxisInput = z.input<typeof createProfileAxisSchema>;

type ProfileAxesEditFormProps = {
  profileAxis: ProfileAxis;
};

export const ProfileAxesEditForm: React.FC<ProfileAxesEditFormProps> = ({ profileAxis }) => {
  const { mutate: updateProfileAxis, isPending } = useUpdateProfileAxis();

  const methods = useForm<CreateProfileAxisInput, unknown, CreateProfileAxisData>({
    resolver: zodResolver(createProfileAxisSchema),
    defaultValues: {
      key: profileAxis.key,
      label: profileAxis.label,
      values: profileAxis.values,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateProfileAxis({ id: profileAxis.id, data })}
      isPending={isPending}
      title="Edit Profile Axis"
      subtitle={profileAxis.key}
      backHref="/profile-axes"
      backLabel="Back to profile axes"
      submitLabel="Save changes"
    >
      <ProfileAxisForm isLoading={isPending} />
    </FormView>
  );
};
