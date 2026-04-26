"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateBlockKindInputSchema,
  type BlockKind,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormView, QueryWrapper } from "@repo/ui";

import { useBlockKind, useUpdateBlockKind } from "@app/lib/hooks";

import { BlockKindLibraryDetailSection } from "../../sections";

type BlockKindDetailFormProps = {
  blockKind: BlockKind;
};

const BlockKindDetailForm: React.FC<BlockKindDetailFormProps> = ({ blockKind }) => {
  const { mutate: updateBlockKind, isPending } = useUpdateBlockKind();

  const methods = useForm<UpdateBlockKindInput>({
    resolver: zodResolver(updateBlockKindInputSchema),
    defaultValues: {
      scope: blockKind.scope,
      name: blockKind.name,
      description: blockKind.description ?? undefined,
      iconKey: blockKind.iconKey ?? undefined,
      defaultWeight: blockKind.defaultWeight,
      defaultArchetypeKind: blockKind.defaultArchetypeKind ?? undefined,
      analyticsCategory: blockKind.analyticsCategory ?? undefined,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateBlockKind({ id: blockKind.id, data })}
      isPending={isPending}
      title="Edit block kind"
      subtitle={blockKind.name}
      backHref="/library/block-kinds"
      backLabel="Back to Block kinds"
    >
      <BlockKindLibraryDetailSection blockKind={blockKind} isPending={isPending} />
    </FormView>
  );
};

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
