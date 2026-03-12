"use client";

import { useState } from "react";

import { Stack, Typography } from "@mui/material";

import { QueryWrapper } from "@repo/query";

import { useTrainingPlansPageData } from "@app/lib/hooks";

import { CreatePlanDialog } from "../components";
import { PlansListSection } from "../sections";

export const PlansView = () => {
  const { data, isLoading, error } = useTrainingPlansPageData();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Stack spacing={2}>
        <Typography variant="h5">Training Plans</Typography>

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
