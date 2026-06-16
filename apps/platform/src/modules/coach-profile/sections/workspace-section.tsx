"use client";

import { useEffect, useRef, useState } from "react";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditLocationAltOutlinedIcon from "@mui/icons-material/EditLocationAltOutlined";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { Box, Button, Card, Chip, Stack } from "@mui/material";

import type { CoachProfileUser } from "@repo/contracts/coaching/coach-profile";
import { detectBrowserTimezone } from "@repo/shared";

import { useUpdateCoachProfile } from "@app/lib/hooks";

import { ProfileSection, SettingRow, TimezoneChangeModal } from "../components";

const SEED_TIMEZONE = "UTC";

const cityFromTimezone = (timezone: string): string =>
  (timezone.split("/").at(-1) ?? timezone).replace(/_/g, " ");

type WorkspaceSectionProps = {
  user: CoachProfileUser;
};

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ user }) => {
  const updateProfile = useUpdateCoachProfile();
  const hasNudgedRef = useRef(false);
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);

  useEffect(() => {
    const deviceTimezone = detectBrowserTimezone();

    setDetectedTimezone(deviceTimezone);

    if (
      !hasNudgedRef.current &&
      user.timezone === SEED_TIMEZONE &&
      deviceTimezone !== null &&
      deviceTimezone !== SEED_TIMEZONE
    ) {
      hasNudgedRef.current = true;
      updateProfile.mutate({ timezone: deviceTimezone });
    }
  }, [user.timezone, updateProfile]);

  const isAutoDetected = detectedTimezone !== null && detectedTimezone === user.timezone;

  return (
    <ProfileSection title="Workspace">
      <Card>
        <SettingRow
          label="Timezone"
          value={
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ rowGap: 0.5 }}
            >
              <span>{cityFromTimezone(user.timezone)}</span>

              <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {user.timezone}
              </Box>

              {detectedTimezone !== null &&
                (isAutoDetected ? (
                  <Chip
                    variant="indicator"
                    color="info"
                    icon={<MyLocationIcon />}
                    label="Auto-detected"
                  />
                ) : (
                  <Chip
                    variant="indicator"
                    color="warning"
                    icon={<EditLocationAltOutlinedIcon />}
                    label="Override active"
                  />
                ))}
            </Stack>
          }
          helper='Used to schedule athlete sessions and align "Today" across the platform.'
          action={
            <Button
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={() => setIsTimezoneModalOpen(true)}
            >
              Change
            </Button>
          }
        />

        <SettingRow
          label="Account email"
          value={user.email}
          helper="Used for sign-in and notifications. Contact support to change."
        />
      </Card>

      <TimezoneChangeModal
        open={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
        value={user.timezone}
        onChange={(timezone) => updateProfile.mutate({ timezone })}
      />
    </ProfileSection>
  );
};
