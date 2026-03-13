"use client";

import { type FormEvent, type SyntheticEvent, useState } from "react";

import { Autocomplete, Avatar, Stack, TextField, Typography } from "@mui/material";

import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import { FormModal } from "@repo/ui";

import { useCreatePlanEnrollment, useSearchUsers } from "@app/lib/hooks";

type UserOption = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type EnrollAthleteDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  enrollments: PlanEnrollment[];
};

export const EnrollAthleteDialog: React.FC<EnrollAthleteDialogProps> = ({
  open,
  onClose,
  planId,
  enrollments,
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserOption | null>(null);
  const { data: users = [] } = useSearchUsers(query);
  const create = useCreatePlanEnrollment(planId);

  const enrolledIds = new Set(enrollments.map((e: PlanEnrollment) => e.userId));
  const options = users.filter((u: UserOption) => !enrolledIds.has(u.id));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selected) {
      return;
    }

    create.mutate({ userId: selected.id }, { onSuccess: () => handleClose() });
  };

  const handleClose = () => {
    setQuery("");
    setSelected(null);
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Enroll Athlete"
      onSubmit={handleSubmit}
      isSubmitting={create.isPending}
      submitText="Enroll"
      submitDisabled={!selected}
    >
      <Autocomplete
        options={options}
        getOptionLabel={(o) => o.name ?? o.email}
        getOptionKey={(o) => o.id}
        value={selected}
        onChange={(_: SyntheticEvent, value: UserOption | null) => setSelected(value)}
        inputValue={query}
        onInputChange={(_, value) => setQuery(value)}
        filterOptions={(x) => x}
        noOptionsText={query.length < 2 ? "Type to search..." : "No athletes found"}
        disabled={create.isPending}
        renderOption={({ key, ...props }, option) => (
          <Stack
            key={key}
            component="li"
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center" }}
            {...props}
          >
            <Avatar src={option.image ?? undefined} sx={{ width: 28, height: 28, fontSize: 12 }}>
              {(option.name ?? option.email).charAt(0).toUpperCase()}
            </Avatar>
            <Stack>
              {option.name && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {option.name}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {option.email}
              </Typography>
            </Stack>
          </Stack>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search athlete"
            placeholder="Name or email"
            size="small"
            autoFocus
          />
        )}
      />
    </FormModal>
  );
};
