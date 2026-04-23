"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateBlockTypeSchema,
  type BlockType,
  type UpdateBlockTypeData,
} from "@repo/contracts/library/block-type";
import { FormView, QueryWrapper } from "@repo/ui";

import { useLibraryBlockType, useUpdateLibraryBlockType } from "@app/lib/hooks";

import { BlockTypeForm } from "../components";

type BlockTypeEditFormProps = {
  blockType: BlockType;
};

const BlockTypeEditForm = ({ blockType }: BlockTypeEditFormProps) => {
  const { mutate: updateBlockType, isPending } = useUpdateLibraryBlockType();

  const methods = useForm<UpdateBlockTypeData>({
    resolver: zodResolver(updateBlockTypeSchema),
    defaultValues: {
      slug: blockType.slug,
      name: blockType.name,
      description: blockType.description ?? undefined,
      iconKey: blockType.iconKey ?? undefined,
      colorKey: blockType.colorKey ?? undefined,
      sortOrder: blockType.sortOrder,
      active: blockType.active,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateBlockType({ id: blockType.id, data })}
      isPending={isPending}
      title="Edit Block Type"
      subtitle={blockType.name}
      backHref="/library/block-types"
      backLabel="Back to Block Types"
    >
      <BlockTypeForm isLoading={isPending} />
    </FormView>
  );
};

type BlockTypeEditViewProps = {
  id: string;
};

export const BlockTypeEditView = ({ id }: BlockTypeEditViewProps) => {
  const { data, isLoading, error } = useLibraryBlockType(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading block type..."
    >
      {(blockType) => <BlockTypeEditForm blockType={blockType} />}
    </QueryWrapper>
  );
};
