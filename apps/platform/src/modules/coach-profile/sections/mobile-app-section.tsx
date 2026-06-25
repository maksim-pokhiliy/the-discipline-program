"use client";

import { useState } from "react";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Alert, Button, Card, Chip, Skeleton, Stack } from "@mui/material";

import { formatDate } from "@repo/shared";

import { useMobileConnections } from "@app/lib/hooks";

import { ConnectMobileModal, ProfileSection, SettingRow } from "../components";

const RECONNECT_NUDGE_DAYS = 3;
const MS_PER_DAY = 86_400_000;
const SKELETON_ROW_HEIGHT_PX = 56;

const daysUntil = (expiresAt: Date | string, now: Date): number =>
  Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / MS_PER_DAY);

const expiryNudgeLabel = (daysRemaining: number): string =>
  daysRemaining <= 0
    ? "Expired"
    : `Reconnects in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`;

export const MobileAppSection: React.FC = () => {
  const { data: connections, isLoading, error } = useMobileConnections();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const connection = connections?.at(0);
  const daysRemaining = connection ? daysUntil(connection.expiresAt, new Date()) : 0;
  const shouldNudge = connection !== undefined && daysRemaining <= RECONNECT_NUDGE_DAYS;

  return (
    <ProfileSection title="Mobile app">
      <Card>
        {isLoading ? (
          <Stack sx={{ p: 1.75 }}>
            <Skeleton variant="rounded" height={SKELETON_ROW_HEIGHT_PX} />
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ m: 1.75 }}>
            Failed to load the mobile app connection.
          </Alert>
        ) : connection === undefined ? (
          <SettingRow
            label="Connection"
            value="Not connected"
            helper="Connect your mobile app to publish plans to athletes."
            action={
              <Button size="small" variant="contained" onClick={() => setIsConnectOpen(true)}>
                Connect mobile app
              </Button>
            }
          />
        ) : (
          <>
            <SettingRow
              label="Connected as"
              value={
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ rowGap: 0.5 }}
                >
                  <span>{connection.legacyUserName}</span>

                  <Chip label={connection.legacyUserRole} size="small" />
                </Stack>
              }
            />

            <SettingRow
              label="Session expires"
              value={
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ rowGap: 0.5 }}
                >
                  <span>{formatDate(connection.expiresAt, "short")}</span>

                  {shouldNudge && (
                    <Chip
                      variant="indicator"
                      color="warning"
                      label={expiryNudgeLabel(daysRemaining)}
                    />
                  )}
                </Stack>
              }
              action={
                <Button
                  size="small"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => setIsConnectOpen(true)}
                >
                  Reconnect
                </Button>
              }
            />
          </>
        )}
      </Card>

      <ConnectMobileModal
        open={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        {...(connection !== undefined && { title: "Reconnect mobile app" })}
      />
    </ProfileSection>
  );
};
