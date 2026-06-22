"use client";

import { QueryWrapper } from "@repo/ui";

import { useProfileAxis } from "@app/lib/hooks";

import { ProfileAxesEditForm } from "./profile-axes-edit-form";

type ProfileAxesEditViewProps = {
  id: string;
};

export const ProfileAxesEditView: React.FC<ProfileAxesEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useProfileAxis(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading profile axis..."
    >
      {(profileAxis) => <ProfileAxesEditForm profileAxis={profileAxis} />}
    </QueryWrapper>
  );
};
