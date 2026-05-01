"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import { type CoachListItem } from "@repo/contracts/iam/user";
import type { PlanCoachAssignment } from "@repo/contracts/lms/plan-coach-assignment";
import { FormModal } from "@repo/ui";

import { useAddPlanCoach, usePlatformCoaches } from "@app/lib/hooks";

type AddCoachDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  planCreatorId: string;
  assignments: PlanCoachAssignment[];
  currentUserId: string;
};

const getOptionLabel = (option: CoachListItem) => option.name ?? option.email;

export const AddCoachDialog: React.FC<AddCoachDialogProps> = ({
  open,
  onClose,
  planId,
  planCreatorId,
  assignments,
  currentUserId,
}) => {
  const [selected, setSelected] = useState<CoachListItem | null>(null);
  const { data: coaches = [], isLoading } = usePlatformCoaches(open);
  const addCoach = useAddPlanCoach(planId);

  const options = useMemo(() => {
    const taken = new Set<string>([
      planCreatorId,
      currentUserId,
      ...assignments.map((a) => a.coachId),
    ]);

    return coaches.filter((c) => !taken.has(c.userId));
  }, [coaches, assignments, planCreatorId, currentUserId]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selected) {
      return;
    }

    addCoach.mutate(
      { coachId: selected.userId, canEdit: true },
      { onSuccess: () => handleClose() },
    );
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Add Co-Coach"
      onSubmit={handleSubmit}
      isSubmitting={addCoach.isPending}
      submitText="Add"
      submitDisabled={!selected}
    >
      <Autocomplete<CoachListItem>
        options={options}
        value={selected}
        onChange={(_, next) => setSelected(next)}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={(option, val) => option.userId === val.userId}
        disabled={addCoach.isPending}
        loading={isLoading}
        noOptionsText={isLoading ? "Loading..." : "No available coaches"}
        renderInput={(params) => {
          const { size, InputLabelProps, InputProps, inputProps, ...rest } = params;

          return (
            <TextField
              {...rest}
              inputProps={inputProps}
              {...(size !== undefined && { size })}
              label="Coach"
              placeholder="Name or email"
              variant="outlined"
              slotProps={{
                inputLabel: InputLabelProps,
                input: {
                  ...InputProps,
                  endAdornment: (
                    <>
                      {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          );
        }}
      />
    </FormModal>
  );
};
