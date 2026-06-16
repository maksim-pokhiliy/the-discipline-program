"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/ui";

import { useCoachProfile } from "@app/lib/hooks";

import {
  CredentialsSection,
  IdentityHeroSection,
  TrackRecordSection,
  WorkspaceSection,
} from "../sections";

export const CoachProfileView = () => {
  const { data, isLoading, error } = useCoachProfile();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading profile..."
    >
      {(pageData) => (
        <Stack spacing={3}>
          <IdentityHeroSection pageData={pageData} />
          <TrackRecordSection trackRecord={pageData.trackRecord} />
          <CredentialsSection credentials={pageData.credentials} />
          <WorkspaceSection user={pageData.user} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
