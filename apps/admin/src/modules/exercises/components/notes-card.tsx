"use client";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";

import { FormCard } from "@app/lib/components/form-card";

type NotesCardProps = {
  isLoading: boolean;
};

export const NotesCard = ({ isLoading }: NotesCardProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  return (
    <FormCard title="Notes">
      <TextField
        label="Notes"
        placeholder="Coaching cues, contraindications, scaling notes..."
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={!!errors.notes}
        helperText={errors.notes?.message}
        {...register("notes")}
      />
    </FormCard>
  );
};
