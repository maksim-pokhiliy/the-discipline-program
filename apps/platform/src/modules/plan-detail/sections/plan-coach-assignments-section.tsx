"use client";

import { useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Stack, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";
import type { PlanCoachAssignment } from "@repo/contracts/lms/plan-coach-assignment";
import { EmptyState, QueryWrapper } from "@repo/ui";

import { usePlanCoachAssignments, usePlatformCoaches, useRemovePlanCoach } from "@app/lib/hooks";

import { AddCoachDialog, CoachAssignmentCard } from "../components";

type PlanCoachAssignmentsSectionProps = {
  planId: string;
  planCreatorId: string;
};

type CoachRow = {
  assignmentId: string | null;
  userId: string;
  name: string;
  email: string;
  isCreator: boolean;
};

const buildRows = (
  assignments: PlanCoachAssignment[],
  coaches: { userId: string; name: string | null; email: string }[],
  planCreatorId: string,
): CoachRow[] => {
  const byUserId = new Map(coaches.map((c) => [c.userId, c] as const));
  const rows: CoachRow[] = [];
  const creatorCoach = byUserId.get(planCreatorId);

  rows.push({
    assignmentId: null,
    userId: planCreatorId,
    name: creatorCoach?.name ?? creatorCoach?.email ?? "Plan creator",
    email: creatorCoach?.email ?? "",
    isCreator: true,
  });

  for (const assignment of assignments) {
    const coach = byUserId.get(assignment.coachId);

    rows.push({
      assignmentId: assignment.id,
      userId: assignment.coachId,
      name: coach?.name ?? coach?.email ?? "Coach",
      email: coach?.email ?? "",
      isCreator: false,
    });
  }

  return rows;
};

export const PlanCoachAssignmentsSection: React.FC<PlanCoachAssignmentsSectionProps> = ({
  planId,
  planCreatorId,
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const { data: list, isLoading, error } = usePlanCoachAssignments(planId);
  const { data: coaches = [] } = usePlatformCoaches();
  const removeCoach = useRemovePlanCoach(planId);
  const [addOpen, setAddOpen] = useState(false);

  const assignments = useMemo(() => list?.items ?? [], [list]);
  const rows = useMemo(
    () => buildRows(assignments, coaches, planCreatorId),
    [assignments, coaches, planCreatorId],
  );

  const isRemoving = (id: string) => removeCoach.isPending && removeCoach.variables === id;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1">Coaches</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          variant="outlined"
        >
          Add co-coach
        </Button>
      </Stack>

      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={list}
        loadingMessage="Loading coaches..."
      >
        {() =>
          rows.length > 0 ? (
            <Grid container spacing={2}>
              {rows.map((row) => (
                <Grid key={row.userId} size={{ xs: 12, md: 6, lg: 4 }}>
                  <CoachAssignmentCard
                    assignmentId={row.assignmentId ?? row.userId}
                    name={row.name}
                    email={row.email}
                    isCreator={row.isCreator}
                    onRemove={(id) => removeCoach.mutate(id)}
                    isRemoving={row.assignmentId !== null && isRemoving(row.assignmentId)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState
              message="No co-coaches yet"
              action={{
                label: "Add co-coach",
                icon: <AddIcon />,
                onClick: () => setAddOpen(true),
              }}
            />
          )
        }
      </QueryWrapper>

      <AddCoachDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        planId={planId}
        planCreatorId={planCreatorId}
        assignments={assignments}
        currentUserId={currentUserId}
      />
    </Stack>
  );
};
