"use client";

import { useState } from "react";

import { Chip, Grid, Menu, MenuItem, Stack, Typography } from "@mui/material";

import { GENDER_LABELS } from "@repo/contracts/athlete-profile";
import { USER_ROLES } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, FormCard } from "@repo/ui";

import { useUpdateUserRole } from "@app/lib/hooks";

import { ROLE_CONFIG } from "../../constants";

interface UserDetailSectionProps {
  user: AdminUser;
}

export const UserDetailSection = ({ user }: UserDetailSectionProps) => {
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  const [roleMenuAnchor, setRoleMenuAnchor] = useState<HTMLElement | null>(null);
  const [pendingRole, setPendingRole] = useState<(typeof USER_ROLES)[number] | null>(null);

  const handleRoleChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleRoleSelect = (role: (typeof USER_ROLES)[number]) => {
    handleRoleMenuClose();

    if (role === user.role) {
      return;
    }

    setPendingRole(role);
  };

  const handleRoleConfirm = () => {
    if (pendingRole) {
      updateRole(
        { id: user.id, data: { role: pendingRole } },
        { onSettled: () => setPendingRole(null) },
      );
    }
  };

  const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, color: "default" as const };
  const pendingRoleConfig = pendingRole ? ROLE_CONFIG[pendingRole] || { label: pendingRole } : null;

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <FormCard title="User Information">
              <Stack spacing={2}>
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Role">
                  <Chip
                    label={roleConfig.label}
                    color={roleConfig.color}
                    size="small"
                    variant="outlined"
                    onClick={handleRoleChipClick}
                    sx={{ cursor: "pointer" }}
                  />
                </DetailRow>
                <DetailRow
                  label="Email Verified"
                  value={
                    user.emailVerified ? formatDate(user.emailVerified, "long") : "Not verified"
                  }
                />
                <DetailRow label="Registered" value={formatDate(user.createdAt, "long")} />
                <DetailRow label="Updated" value={formatDate(user.updatedAt, "long")} />
              </Stack>
            </FormCard>

            {user.athleteProfile && (
              <FormCard title="Athlete Profile">
                <Stack spacing={2}>
                  <DetailRow label="Name" value={user.athleteProfile.name || "—"} />
                  <DetailRow
                    label="Gender"
                    value={
                      user.athleteProfile.gender ? GENDER_LABELS[user.athleteProfile.gender] : "—"
                    }
                  />
                  <DetailRow
                    label="Height"
                    value={
                      user.athleteProfile.heightCm ? `${user.athleteProfile.heightCm} cm` : "—"
                    }
                  />
                  <DetailRow
                    label="Weight"
                    value={
                      user.athleteProfile.weightKg ? `${user.athleteProfile.weightKg} kg` : "—"
                    }
                  />
                </Stack>
              </FormCard>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {user.coachProfile && (
              <FormCard title="Coach Profile">
                <Stack spacing={2}>
                  <DetailRow label="Bio" value={user.coachProfile.bio || "—"} />
                </Stack>
              </FormCard>
            )}

            {!user.athleteProfile && !user.coachProfile && (
              <FormCard title="Profiles">
                <Typography variant="body2" color="text.secondary">
                  No profiles created yet.
                </Typography>
              </FormCard>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Menu anchorEl={roleMenuAnchor} open={!!roleMenuAnchor} onClose={handleRoleMenuClose}>
        {USER_ROLES.map((role) => (
          <MenuItem key={role} onClick={() => handleRoleSelect(role)} selected={user.role === role}>
            {ROLE_CONFIG[role]?.label || role}
          </MenuItem>
        ))}
      </Menu>

      <ConfirmationModal
        open={!!pendingRole}
        title="Change User Role"
        message={`Change role from "${roleConfig.label}" to "${pendingRoleConfig?.label}"?`}
        details="This will immediately affect the user's permissions and access level."
        confirmText="Change Role"
        type="warning"
        isConfirming={isPending}
        onConfirm={handleRoleConfirm}
        onClose={() => setPendingRole(null)}
      />
    </>
  );
};

interface DetailRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

const DetailRow = ({ label, value, children }: DetailRowProps) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography variant="subtitle2" sx={{ minWidth: 120 }}>
      {label}:
    </Typography>
    {children || <Typography variant="body2">{value}</Typography>}
  </Stack>
);
