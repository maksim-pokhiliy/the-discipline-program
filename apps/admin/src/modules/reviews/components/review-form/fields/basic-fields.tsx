"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import { Program } from "@repo/api";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { ReviewFormData } from "@app/modules/reviews/shared";

interface BasicFieldsProps {
  control: Control<ReviewFormData>;
  errors: FieldErrors<ReviewFormData>;
  isSubmitting: boolean;
  programs: Program[];
}

export const BasicFields = ({ control, errors, isSubmitting, programs }: BasicFieldsProps) => {
  return (
    <Stack spacing={3}>
      <Controller
        name="authorName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Author Name"
            error={!!errors.authorName}
            helperText={errors.authorName?.message}
            required
            fullWidth
            disabled={isSubmitting}
            size="small"
            placeholder="John Smith"
          />
        )}
      />

      <Controller
        name="authorRole"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Author Role/Title"
            error={!!errors.authorRole}
            helperText={errors.authorRole?.message || "e.g. CrossFit Athlete, Personal Trainer"}
            required
            fullWidth
            disabled={isSubmitting}
            size="small"
            placeholder="Professional Athlete"
          />
        )}
      />

      <Controller
        name="programId"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Related Program"
            error={!!errors.programId}
            helperText={errors.programId?.message || "Optional - link review to specific program"}
            fullWidth
            disabled={isSubmitting}
            size="small"
            value={field.value || ""}
          >
            <MenuItem value="">
              <em>No specific program</em>
            </MenuItem>

            {programs.map((program) => (
              <MenuItem key={program.id} value={program.id}>
                {program.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <Controller
        name="text"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Review Text"
            error={!!errors.text}
            helperText={errors.text?.message || "The main review content"}
            required
            fullWidth
            multiline
            rows={5}
            disabled={isSubmitting}
            size="small"
            placeholder="This program has completely transformed my fitness journey..."
          />
        )}
      />
    </Stack>
  );
};
