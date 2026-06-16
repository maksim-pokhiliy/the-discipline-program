"use client";

import { useEffect, useRef } from "react";

import { Stack, TextField } from "@mui/material";

import type { CoachProfileUser } from "@repo/contracts/coaching/coach-profile";
import { detectBrowserTimezone } from "@repo/shared";
import { TimezoneAutocomplete } from "@repo/ui";

import { useUpdateCoachProfile } from "@app/lib/hooks";

import { ProfileSection } from "../components";

const SEED_TIMEZONE = "UTC";

type WorkspaceSectionProps = {
  user: CoachProfileUser;
};

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ user }) => {
  const updateProfile = useUpdateCoachProfile();
  const hasNudgedRef = useRef(false);

  useEffect(() => {
    if (hasNudgedRef.current || user.timezone !== SEED_TIMEZONE) {
      return;
    }

    const deviceTimezone = detectBrowserTimezone();

    if (deviceTimezone !== null && deviceTimezone !== SEED_TIMEZONE) {
      hasNudgedRef.current = true;
      updateProfile.mutate({ timezone: deviceTimezone });
    }
  }, [user.timezone, updateProfile]);

  return (
    <ProfileSection title="Workspace">
      <Stack spacing={2}>
        <TimezoneAutocomplete
          value={user.timezone}
          onChange={(timezone) => updateProfile.mutate({ timezone })}
          onBlur={() => undefined}
          label="Timezone"
        />

        <TextField
          label="Email"
          value={user.email}
          disabled
          fullWidth
          type="email"
          helperText="Contact support to change"
        />
      </Stack>
    </ProfileSection>
  );
};
