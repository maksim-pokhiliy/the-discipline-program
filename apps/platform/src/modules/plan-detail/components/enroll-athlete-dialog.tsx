"use client";

import { type FormEvent, type SyntheticEvent, useState } from "react";

import { Autocomplete, Avatar, Checkbox, Stack, TextField, Typography } from "@mui/material";

import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import type { UserSearchResult } from "@repo/contracts/user";
import { FormModal } from "@repo/ui";

import { useBulkEnrollAthletes, useSearchUsers } from "@app/lib/hooks";

const SELECT_ALL_ID = "__select_all__";
const SELECT_ALL_OPTION: UserSearchResult = {
  id: SELECT_ALL_ID,
  name: "Select All",
  email: "",
  image: null,
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
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const { data: users = [] } = useSearchUsers(query, open);
  const bulkEnroll = useBulkEnrollAthletes(planId);

  const enrolledIds = new Set(enrollments.map((e: PlanEnrollment) => e.userId));
  const options = users.filter((u: UserSearchResult) => !enrolledIds.has(u.id));
  const selectedIds = new Set(selected.map((u) => u.id));
  const someSelected = options.some((o) => selectedIds.has(o.id));
  const allSelected = options.length > 0 && options.every((o) => selectedIds.has(o.id));

  const handleChange = (_: SyntheticEvent, value: UserSearchResult[]) => {
    if (value.some((v) => v.id === SELECT_ALL_ID)) {
      if (allSelected) {
        setSelected(selected.filter((s) => !options.some((o) => o.id === s.id)));
      } else {
        const newOptions = options.filter((o) => !selectedIds.has(o.id));

        setSelected([...selected, ...newOptions]);
      }
    } else {
      setSelected(value);
    }
  };

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
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selected}
        onChange={handleChange}
        inputValue={query}
        onInputChange={(_, value) => setQuery(value)}
        filterOptions={(opts) => (opts.length > 0 ? [SELECT_ALL_OPTION, ...opts] : opts)}
        disableCloseOnSelect
        noOptionsText="No athletes found"
        disabled={bulkEnroll.isPending}
        renderOption={({ key, ...props }, option, { selected: isSelected }) => {
          const isSelectAll = option.id === SELECT_ALL_ID;

          if (isSelectAll) {
            return (
              <Stack
                key={key}
                component="li"
                direction="row"
                spacing={1}
                alignItems="center"
                {...props}
              >
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} />
                <Typography variant="subtitle2">Select All</Typography>
              </Stack>
            );
          }

          return (
            <Stack
              key={key}
              component="li"
              direction="row"
              spacing={1}
              alignItems="center"
              {...props}
            >
              <Checkbox checked={isSelected} />
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
                {option.name && <Typography variant="body2">{option.name}</Typography>}
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {option.email}
                </Typography>
              </Stack>
            </Stack>
          );
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search athletes" placeholder="Name or email" autoFocus />
        )}
      />
    </FormModal>
  );
};
