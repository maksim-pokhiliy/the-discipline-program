"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";

import {
  type CoachListItem,
  type CreateUserData,
  type UpdateUserData,
} from "@repo/contracts/iam/user";
import { MultiSelect } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

type UserFormValues = CreateUserData & UpdateUserData;

type AthleteCoachPickerProps = {
  control: Control<UserFormValues>;
  errors: FieldErrors<UserFormValues>;
  isFormLoading: boolean;
};

export const AthleteCoachPicker = ({ control, errors, isFormLoading }: AthleteCoachPickerProps) => {
  const { data: coaches = [], isLoading: isCoachesLoading } = useCoachesList();

  return (
    <Controller
      name="coachIds"
      control={control}
      shouldUnregister
      render={({ field }) => (
        <MultiSelect<CoachListItem>
          options={coaches}
          value={field.value ?? []}
          onChange={field.onChange}
          getOptionId={(c) => c.id}
          getOptionLabel={(c) => c.name ?? c.email}
          getOptionSubLabel={(c) => (c.name ? c.email : null)}
          label="Coaches"
          placeholder="Select coaches"
          emptyLabel="No coaches available"
          isLoading={isCoachesLoading}
          disabled={isFormLoading}
          errorText={errors.coachIds?.message}
        />
      )}
    />
  );
};
