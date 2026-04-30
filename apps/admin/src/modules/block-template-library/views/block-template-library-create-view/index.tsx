"use client";

import { Alert, CircularProgress, Stack } from "@mui/material";

import { type BlockKind } from "@repo/contracts/lms/block-kind";

import { useBlockKindsPageData } from "@app/lib/hooks";

import { BlockTemplateCreateForm } from "./block-template-create-form";

export const BlockTemplateLibraryCreateView = () => {
  const { data: blockKindsResponse, isLoading, isError } = useBlockKindsPageData();

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">Failed to load block kinds. Refresh the page to try again.</Alert>
    );
  }

  const blockKinds: BlockKind[] = blockKindsResponse?.items ?? [];
  const firstKind = blockKinds[0];

  if (!firstKind) {
    return (
      <Alert severity="warning">
        No block kinds found in the library. Create at least one block kind before authoring a
        template.
      </Alert>
    );
  }

  return <BlockTemplateCreateForm initialKindId={firstKind.id} />;
};
