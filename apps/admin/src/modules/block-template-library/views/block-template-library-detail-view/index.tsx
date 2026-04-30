"use client";

import { QueryWrapper } from "@repo/ui";

import { useBlockTemplate } from "@app/lib/hooks";

import { BlockTemplateDetailForm } from "./block-template-detail-form";

type BlockTemplateLibraryDetailViewProps = {
  id: string;
};

export const BlockTemplateLibraryDetailView: React.FC<BlockTemplateLibraryDetailViewProps> = ({
  id,
}) => {
  const { data, isLoading, error } = useBlockTemplate(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading block template..."
    >
      {(blockTemplate) => <BlockTemplateDetailForm blockTemplate={blockTemplate} />}
    </QueryWrapper>
  );
};
