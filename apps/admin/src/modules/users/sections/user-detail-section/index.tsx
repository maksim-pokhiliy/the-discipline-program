"use client";

import SendIcon from "@mui/icons-material/Send";
import { Button, Grid, Stack, Typography, useTheme } from "@mui/material";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import { formatDate } from "@repo/shared";
import { DetailField, UserChip } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";
import { useResendInvite } from "@app/lib/hooks";

import { ProfileCard, UserForm } from "../../components";

type UserDetailSectionProps = {
  user: AdminUserView;
  isPending: boolean;
  isReadOnly: boolean;
};

export const UserDetailSection = ({ user, isPending, isReadOnly }: UserDetailSectionProps) => {
  const theme = useTheme();
  const { mutate: resendInvite, isPending: isResending } = useResendInvite();
  const canResendInvite = !user.hasPassword;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <UserChip user={user} size="large" />

        {canResendInvite && (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            startIcon={<SendIcon />}
            disabled={isResending}
            onClick={() => resendInvite(user.id)}
          >
            {isResending ? "Resending..." : "Resend invite"}
          </Button>
        )}
      </Stack>

      {isReadOnly && (
        <Typography variant="body2" color="text.secondary">
          Only an ADMIN can change user records.
        </Typography>
      )}

      <UserForm isEdit isLoading={isPending} isReadOnly={isReadOnly} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <FormCard title="Metadata">
              <Stack spacing={2}>
                <DetailField
                  label="Email Verified"
                  value={
                    user.emailVerified ? formatDate(user.emailVerified, "long") : "Not verified"
                  }
                />

                <DetailField label="Registered" value={formatDate(user.createdAt, "long")} />

                <DetailField label="Updated" value={formatDate(user.updatedAt, "long")} />
              </Stack>
            </FormCard>

            <ProfileCard user={user} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <FormCard title="Account">
              <Stack spacing={2}>
                <DetailField label="ID" labelWidth={theme.spacing(10)} value={user.id} />
              </Stack>
            </FormCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};
