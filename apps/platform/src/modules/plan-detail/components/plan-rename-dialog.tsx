"use client";

import { useEffect, useState } from "react";

import { TextField } from "@mui/material";

import { TRAINING_PLAN_CONSTANTS } from "@repo/contracts/lms/training-plan";
import { FormModal } from "@repo/ui";

const MODAL_TITLE = "Rename plan";
const NAME_LABEL = "Plan name";
const DESCRIPTION_LABEL = "Description";
const DESCRIPTION_ROWS = 4;

export type PlanRenameValues = { name: string; description: string | null };

type PlanRenameDialogProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  description: string | null;
  onSave: (values: PlanRenameValues) => void;
  isSaving: boolean;
};

export const PlanRenameDialog: React.FC<PlanRenameDialogProps> = ({
  open,
  onClose,
  name,
  description,
  onSave,
  isSaving,
}) => {
  const [nameDraft, setNameDraft] = useState(name);
  const [descriptionDraft, setDescriptionDraft] = useState(description ?? "");

  useEffect(() => {
    if (open) {
      setNameDraft(name);
      setDescriptionDraft(description ?? "");
    }
  }, [open, name, description]);

  const trimmedName = nameDraft.trim();
  const isNameValid = trimmedName.length > 0;

  const handleSubmit = () => {
    if (!isNameValid) {
      return;
    }

    const trimmedDescription = descriptionDraft.trim();

    onSave({
      name: trimmedName,
      description: trimmedDescription === "" ? null : trimmedDescription,
    });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={MODAL_TITLE}
      maxWidth="sm"
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitDisabled={!isNameValid}
      submitText="Save"
    >
      <TextField
        label={NAME_LABEL}
        variant="outlined"
        fullWidth
        size="small"
        autoFocus
        disabled={isSaving}
        value={nameDraft}
        onChange={(event) => setNameDraft(event.target.value)}
        error={!isNameValid}
        slotProps={{ htmlInput: { maxLength: TRAINING_PLAN_CONSTANTS.MAX_NAME_LENGTH } }}
      />

      <TextField
        label={DESCRIPTION_LABEL}
        variant="outlined"
        fullWidth
        size="small"
        multiline
        minRows={DESCRIPTION_ROWS}
        disabled={isSaving}
        value={descriptionDraft}
        onChange={(event) => setDescriptionDraft(event.target.value)}
        slotProps={{ htmlInput: { maxLength: TRAINING_PLAN_CONSTANTS.MAX_DESCRIPTION_LENGTH } }}
      />
    </FormModal>
  );
};
