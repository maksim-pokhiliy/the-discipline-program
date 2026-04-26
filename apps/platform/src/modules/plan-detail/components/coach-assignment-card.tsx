"use client";

import { useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Stack, Typography } from "@mui/material";

import { ConfirmationModal, PersonCard } from "@repo/ui";

type CoachAssignmentCardProps = {
  assignmentId: string;
  name: string;
  email: string;
  isCreator: boolean;
  onRemove: (assignmentId: string) => void;
  isRemoving: boolean;
};

export const CoachAssignmentCard: React.FC<CoachAssignmentCardProps> = ({
  assignmentId,
  name,
  email,
  isCreator,
  onRemove,
  isRemoving,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <PersonCard
        image={null}
        name={name}
        action={
          isCreator ? null : (
            <Stack sx={{ pt: 1, pr: 1 }}>
              <IconButton
                onClick={() => setConfirmOpen(true)}
                disabled={isRemoving}
                aria-label={`Remove ${name}`}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          )
        }
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {isCreator ? "Plan creator" : email}
          </Typography>
        </Stack>
      </PersonCard>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Remove Coach"
        type="danger"
        message={`Remove ${name} as a co-coach?`}
        details="They will lose edit access to this plan."
        isConfirming={isRemoving}
        onConfirm={() => onRemove(assignmentId)}
      />
    </>
  );
};
