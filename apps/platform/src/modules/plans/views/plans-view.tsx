"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";

import { PageHeader, QueryWrapper } from "@repo/ui";

import { useTrainingPlansPageData } from "@app/lib/hooks";

import { CreatePlanDialog } from "../components";
import { PlansListSection } from "../sections";

export const PlansView = () => {
  const { data, isLoading, error } = useTrainingPlansPageData();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Stack spacing={4}>
        <PageHeader
          title="Training Plans"
          actions={
            <Button
              endIcon={<AddIcon />}
              size="small"
              color="primary"
              onClick={() => setCreateOpen(true)}
            >
              Create
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
