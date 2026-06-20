"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { PlatformPageHeader, QueryWrapper } from "@repo/ui";

import { useTrainingPlansPageData } from "@app/lib/hooks";

import { CreatePlanDialog } from "../components";
import { PlansListSection } from "../sections";

export const PlansView = () => {
  const { data, isLoading, error } = useTrainingPlansPageData();
  const [createOpen, setCreateOpen] = useState(false);

  const activePlanCount = data?.plans.filter(
    (plan) => plan.status === TrainingPlanStatus.ACTIVE,
  ).length;

  return (
    <>
      <Stack spacing={4}>
        <PlatformPageHeader
          title="Plans"
          {...(activePlanCount !== undefined && { eyebrow: `${activePlanCount} active` })}
          actions={
            <Button
              startIcon={<AddIcon />}
              size="small"
              color="primary"
              variant="contained"
              onClick={() => setCreateOpen(true)}
            >
              New plan
            </Button>
          }
        />

        <QueryWrapper
          isLoading={isLoading}
          error={error}
          data={data}
          loadingMessage="Loading plans..."
        >
          {(data) => (
            <PlansListSection plans={data.plans} onCreateClick={() => setCreateOpen(true)} />
          )}
        </QueryWrapper>
      </Stack>

      <CreatePlanDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
};
