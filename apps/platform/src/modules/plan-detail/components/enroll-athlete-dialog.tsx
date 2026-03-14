"use client";

import { type FormEvent, type SyntheticEvent, useState } from "react";

import { Autocomplete, Avatar, Stack, TextField, Typography } from "@mui/material";

import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import { FormModal } from "@repo/ui";

import { useBulkEnrollAthletes, useSearchUsers } from "@app/lib/hooks";

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
  const [selected, setSelected] = useState<UserOption[]>([]);
  const { data: users = [] } = useSearchUsers(query, open);
  const bulkEnroll = useBulkEnrollAthletes(planId);

  const enrolledIds = new Set(enrollments.map((e: PlanEnrollment) => e.userId));
  const selectedIds = new Set(selected.map((u) => u.id));
  const options = users.filter((u: UserOption) => !enrolledIds.has(u.id) && !selectedIds.has(u.id));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selected.length === 0) {
      return;
    }

    bulkEnroll.mutate(
      selected.map((u) => u.id),
      { onSuccess: () => handleClose() },
    );
  };

  const handleClose = () => {
    setQuery("");
    setSelected([]);
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Enroll Athletes"
      onSubmit={handleSubmit}
      isSubmitting={bulkEnroll.isPending}
      submitText={selected.length > 1 ? `Enroll ${selected.length} Athletes` : "Enroll"}
      submitDisabled={selected.length === 0}
    >
      <Autocomplete
        multiple
        options={options}
        getOptionLabel={(o) => o.name ?? o.email}
        getOptionKey={(o) => o.id}
        value={selected}
        onChange={(_: SyntheticEvent, value: UserOption[]) => setSelected(value)}
        inputValue={query}
        onInputChange={(_, value) => setQuery(value)}
        filterOptions={(x) => x}
        disableCloseOnSelect
        noOptionsText="No athletes found"
        disabled={bulkEnroll.isPending}
        renderOption={({ key, ...props }, option) => (
          <Stack
            key={key}
            component="li"
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center" }}
            {...props}
          >
            <Avatar
              src={option.image ?? undefined}
              sx={(theme) => ({
                width: theme.spacing(3.5),
                height: theme.spacing(3.5),
                fontSize: theme.typography.caption.fontSize,
              })}
            >
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
            label="Search athletes"
            placeholder="Name or email"
            size="small"
            autoFocus
          />
        )}
      />
    </FormModal>
  );
};
