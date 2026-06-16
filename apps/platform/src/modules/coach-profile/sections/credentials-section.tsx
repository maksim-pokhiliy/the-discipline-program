"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, Typography } from "@mui/material";

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

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    deleteCredential.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
  };

  return (
    <ProfileSection
      title="Credentials"
      action={
        <Button startIcon={<AddIcon />} size="small" onClick={() => setIsAddOpen(true)}>
          Add credential
        </Button>
      }
    >
      {credentials.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No credentials yet — add your certifications and they&apos;ll show here.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {credentials.map((credential) => (
            <CredentialRow
              key={credential.id}
              credential={credential}
              isMutating={updateCredential.isPending || deleteCredential.isPending}
              onToggleShown={(shownToAthletes) =>
                updateCredential.mutate({ id: credential.id, data: { shownToAthletes } })
              }
              onDelete={() => setPendingDelete(credential)}
            />
          ))}
        </Stack>
      )}

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
