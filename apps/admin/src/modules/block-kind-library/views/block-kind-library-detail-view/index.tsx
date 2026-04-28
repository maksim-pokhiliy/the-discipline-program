"use client";

import { QueryWrapper } from "@repo/ui";

import { useBlockKind } from "@app/lib/hooks";

import { BlockKindDetailForm } from "./block-kind-detail-form";

type BlockKindLibraryDetailViewProps = {
  id: string;
};

export const BlockKindLibraryDetailView: React.FC<BlockKindLibraryDetailViewProps> = ({ id }) => {
  const { data, isLoading, error } = useBlockKind(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading block kind..."
    >
      {(blockKind) => <BlockKindDetailForm blockKind={blockKind} />}
    </QueryWrapper>
  );
};
