"use client";

import { QueryWrapper } from "@repo/ui";

import { useBlockType } from "@app/lib/hooks";

import { BlockTypesEditForm } from "./block-types-edit-form";

type BlockTypesEditViewProps = {
  id: string;
};

export const BlockTypesEditView: React.FC<BlockTypesEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useBlockType(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading block type..."
    >
      {(blockType) => <BlockTypesEditForm blockType={blockType} />}
    </QueryWrapper>
  );
};
