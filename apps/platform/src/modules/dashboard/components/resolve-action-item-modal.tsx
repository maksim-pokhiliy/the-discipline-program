"use client";

import { type FormEvent, type ReactElement, useState } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ForumIcon from "@mui/icons-material/Forum";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { Box, Stack, TextField, Typography } from "@mui/material";

import { ActionItemResolveReason } from "@repo/contracts/coaching/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import { COACH_NOTE_CONSTANTS } from "@repo/contracts/coaching/coach-note";
import { formatTimeAgo } from "@repo/shared";
import { ActionTypeChip, FormModal, ReasonOption, SeverityActionCard } from "@repo/ui";

import { useResolveActionItem } from "@app/lib/hooks";

const MODAL_TITLE = "Resolve action item";
const SUBMIT_TEXT = "Resolve";
const REASON_SECTION_LABEL = "Resolve reason";
const NOTE_FIELD_LABEL = "Add a note";
const NOTE_HELPER_TEXT = "Optional — saved to athlete's notes";
const NOTE_ROWS = 3;
const AUTO_BADGE = "Auto";

type ReasonDescriptor = {
  reason: ActionItemResolveReason;
  icon: ReactElement;
  title: string;
  description: string;
};

const REASON_DESCRIPTORS: ReasonDescriptor[] = [
  {
    reason: ActionItemResolveReason.MANUAL_CONTACTED,
    icon: <ForumIcon />,
    title: "I contacted the athlete",
    description: "Direct outreach handled. Closes item, logs to athlete notes with timestamp.",
  },
  {
    reason: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
    icon: <CheckCircleIcon />,
    title: "Condition cleared",
    description:
      "Auto-resolved when the underlying signal disappears (athlete logs again / health flag lifted). Set by the system, not selectable here.",
  },
  {
    reason: ActionItemResolveReason.AUTO_ASSIGNMENT_ENDED,
    icon: <PersonRemoveIcon />,
    title: "Assignment ended",
    description:
      "Auto-resolved when the athlete leaves the plan (passenger off the train). Set by the system.",
  },
];

export type ResolveActionItemModalProps = {
  open: boolean;
  onClose: () => void;
  item: DashboardActionItem | null;
};

export const ResolveActionItemModal = ({
  open,
  onClose,
  item,
}: ResolveActionItemModalProps): ReactElement | null => {
  const [note, setNote] = useState("");
  const resolveActionItem = useResolveActionItem();

  if (item === null) {
    return null;
  }

  const handleClose = (): void => {
    setNote("");
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmedNote = note.trim();

    resolveActionItem.mutate(
      {
        itemId: item.id,
        athleteId: item.athleteId,
        ...(trimmedNote.length > 0 && { note: trimmedNote }),
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={MODAL_TITLE}
      onSubmit={handleSubmit}
      isSubmitting={resolveActionItem.isPending}
      submitText={SUBMIT_TEXT}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          {item.athleteName}
        </Typography>
        <ActionTypeChip type={item.type} />
        <Box component="span" sx={{ color: "text.faint" }}>
          ·
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatTimeAgo(item.createdAt)}
        </Typography>
      </Stack>

      <SeverityActionCard severity={item.severity}>
        <Typography
          sx={{ fontSize: (theme) => theme.typography.pxToRem(13), color: "text.primary" }}
        >
          {item.message}
        </Typography>
      </SeverityActionCard>

      <Stack spacing={1}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {REASON_SECTION_LABEL}
        </Typography>
        <Stack spacing={1}>
          {REASON_DESCRIPTORS.map((descriptor) => {
            const isManual = descriptor.reason === ActionItemResolveReason.MANUAL_CONTACTED;

            return (
              <ReasonOption
                key={descriptor.reason}
                icon={descriptor.icon}
                title={descriptor.title}
                description={descriptor.description}
                selected={isManual}
                disabled={!isManual}
                {...(!isManual && { badge: AUTO_BADGE })}
              />
            );
          })}
        </Stack>
      </Stack>

      <TextField
        label={NOTE_FIELD_LABEL}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        fullWidth
        multiline
        rows={NOTE_ROWS}
        helperText={NOTE_HELPER_TEXT}
        slotProps={{ htmlInput: { maxLength: COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH } }}
      />
    </FormModal>
  );
};
