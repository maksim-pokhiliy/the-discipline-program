import { Chip, Stack, Typography } from "@mui/material";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import { GENDER_LABELS } from "@repo/contracts/coaching/athlete-profile";
import { UserRole } from "@repo/contracts/iam/auth";
import { DetailField, FormCard } from "@repo/ui";

type ProfileCardProps = {
  user: AdminUserView;
};

export const ProfileCard = ({ user }: ProfileCardProps) => {
  const { role, athleteProfile, coachProfile } = user;

  if (role === UserRole.ATHLETE) {
    if (!athleteProfile) {
      return (
        <FormCard title="Athlete Profile">
          <Typography variant="body2" color="text.secondary">
            No athlete profile yet — it is created automatically when an admin creates an athlete
            from this console.
          </Typography>
        </FormCard>
      );
    }

    return (
      <FormCard title="Athlete Profile">
        <Stack spacing={2}>
          <DetailField label="Name" value={user.name || "—"} />
          <DetailField
            label="Gender"
            value={athleteProfile.gender ? GENDER_LABELS[athleteProfile.gender] : "—"}
          />
          <DetailField
            label="Height"
            value={athleteProfile.heightCm ? `${athleteProfile.heightCm} cm` : "—"}
          />
          <DetailField
            label="Weight"
            value={athleteProfile.weightKg ? `${athleteProfile.weightKg} kg` : "—"}
          />
          <DetailField label="Assigned Coaches" alignItems="flex-start">
            {athleteProfile.assignedCoaches.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {athleteProfile.assignedCoaches.map((coach) => (
                  <Chip key={coach.id} label={coach.name ?? coach.email} size="small" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Not assigned to any coach.
              </Typography>
            )}
          </DetailField>
        </Stack>
      </FormCard>
    );
  }

  if (role === UserRole.COACH) {
    if (!coachProfile) {
      return (
        <FormCard title="Coach Profile">
          <Typography variant="body2" color="text.secondary">
            No coach profile yet — the user becomes a coach by completing their coach onboarding on
            the platform.
          </Typography>
        </FormCard>
      );
    }

    return (
      <FormCard title="Coach Profile">
        <Stack spacing={2}>
          <DetailField label="Bio" value={coachProfile.bio || "—"} />
        </Stack>
      </FormCard>
    );
  }

  return null;
};
