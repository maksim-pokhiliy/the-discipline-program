"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { ButtonBase, Card, Stack, Typography, alpha } from "@mui/material";

import type { CoachCredential } from "@repo/contracts/coaching/coach-credential";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteCredential, useUpdateCredential } from "@app/lib/hooks";

import { AddCredentialModal, CredentialRow, ProfileSection } from "../components";

type CredentialsSectionProps = {
  credentials: CoachCredential[];
};

export const CredentialsSection: React.FC<CredentialsSectionProps> = ({ credentials }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CoachCredential | null>(null);

  const updateCredential = useUpdateCredential();
  const deleteCredential = useDeleteCredential();

  const isMutating = updateCredential.isPending || deleteCredential.isPending;
  const shownCount = credentials.filter((credential) => credential.shownToAthletes).length;

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    deleteCredential.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
  };

  return (
    <ProfileSection
      title="Credentials"
      count={credentials.length}
      {...(credentials.length > 0 && { meta: `${shownCount} shown to athletes` })}
    >
      <Card>
        {credentials.length === 0 ? (
          <Stack spacing={1} alignItems="center" sx={{ px: 2, py: 3.5, textAlign: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              No credentials yet.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
              Add your degrees, certifications and licences. Each one shows up under your name on
              the athlete-facing page.
            </Typography>
          </Stack>
        ) : (
          credentials.map((credential) => (
            <CredentialRow
              key={credential.id}
              credential={credential}
              isMutating={isMutating}
              onToggleShown={(shownToAthletes) =>
                updateCredential.mutate({ id: credential.id, data: { shownToAthletes } })
              }
              onDelete={() => setPendingDelete(credential)}
            />
          ))
        )}

        <ButtonBase
          onClick={() => setIsAddOpen(true)}
          sx={(theme) => ({
            width: "100%",
            py: 1.5,
            gap: 0.75,
            color: "primary.main",
            borderTop: `1px dashed ${theme.palette.divider}`,
            typography: "button",
            transition: theme.transitions.create("background-color"),

            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          })}
        >
          <AddIcon sx={{ fontSize: 18 }} />
          Add credential
        </ButtonBase>
      </Card>

      <AddCredentialModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <ConfirmationModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        type="danger"
        title="Delete credential"
        message="Delete this credential? This can't be undone."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        isConfirming={deleteCredential.isPending}
      />
    </ProfileSection>
  );
};
