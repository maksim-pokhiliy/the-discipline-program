"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Avatar } from "@mui/material";

import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import type { UserSearchResult } from "@repo/contracts/iam/user";
import { FormModal, MultiSelect } from "@repo/ui";

import { useBulkEnrollAthletes, useSearchUsers } from "@app/lib/hooks";

type EnrollAthleteDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  enrollments: PlanRosterEntry[];
};

export const EnrollAthleteDialog: React.FC<EnrollAthleteDialogProps> = ({
  open,
  onClose,
  planId,
  enrollments,
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const { data: users = [], isFetching } = useSearchUsers(query, open);
  const bulkEnroll = useBulkEnrollAthletes(planId);

  const options = useMemo(() => {
    const enrolledIds = new Set(enrollments.map((e) => e.userId));
    const available = users.filter((u) => !enrolledIds.has(u.id));
    const seen = new Set(available.map((u) => u.id));
    const merged: UserSearchResult[] = [...available];

    for (const user of selected) {
      if (!seen.has(user.id) && !enrolledIds.has(user.id)) {
        merged.push(user);
        seen.add(user.id);
      }
    }

    return merged;
  }, [users, enrollments, selected]);

  const handleChange = (nextIds: string[]) => {
    const byId = new Map(options.map((o) => [o.id, o]));

    setSelected(nextIds.map((id) => byId.get(id)).filter((u): u is UserSearchResult => Boolean(u)));
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
      <MultiSelect<UserSearchResult>
        options={options}
        value={selected.map((u) => u.id)}
        onChange={handleChange}
        getOptionId={(u) => u.id}
        getOptionLabel={(u) => u.name ?? u.email}
        getOptionSubLabel={(u) => (u.name ? u.email : null)}
        renderOptionIcon={(u) => (
          <Avatar
            src={u.image ?? undefined}
            sx={(theme) => ({
              width: theme.spacing(3.5),
              height: theme.spacing(3.5),
              fontSize: theme.typography.caption.fontSize,
            })}
          >
            {(u.name ?? u.email).charAt(0).toUpperCase()}
          </Avatar>
        )}
        label="Search athletes"
        placeholder="Name or email"
        emptyLabel="No athletes found"
        inputValue={query}
        onInputChange={setQuery}
        disabled={bulkEnroll.isPending}
        isLoading={isFetching}
      />
    </FormModal>
  );
};
