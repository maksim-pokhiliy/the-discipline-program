"use client";

import { Stack, Typography, Rating, Box, FormHelperText } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { ReviewFormData } from "../../../shared/types";

interface RatingFieldProps {
  control: Control<ReviewFormData>;
  errors: FieldErrors<ReviewFormData>;
  isSubmitting: boolean;
}

const ratingLabels: { [key: number]: string } = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const RatingField = ({ control, errors, isSubmitting }: RatingFieldProps) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rating
      </Typography>

      <Controller
        name="rating"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Stack spacing={1}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Rating
                value={value}
                onChange={(_, newValue) => {
                  onChange(newValue || 5);
                }}
                disabled={isSubmitting}
                size="large"
                precision={1}
              />
              {value > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {ratingLabels[value]}
                </Typography>
              )}
            </Stack>

            {errors.rating && <FormHelperText error>{errors.rating.message}</FormHelperText>}
          </Stack>
        )}
      />
    </Box>
  );
};
