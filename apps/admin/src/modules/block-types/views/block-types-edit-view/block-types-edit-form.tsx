"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createBlockTypeSchema,
  type BlockType,
  type CreateBlockTypeData,
} from "@repo/contracts/lms/block-type";
import { FormView } from "@repo/ui";

import { useUpdateBlockType } from "@app/lib/hooks";

import { BlockTypeForm } from "../../components";

type CreateBlockTypeInput = z.input<typeof createBlockTypeSchema>;

type BlockTypesEditFormProps = {
  blockType: BlockType;
};

export const BlockTypesEditForm: React.FC<BlockTypesEditFormProps> = ({ blockType }) => {
  const { mutate: updateBlockType, isPending } = useUpdateBlockType();

  const methods = useForm<CreateBlockTypeInput, unknown, CreateBlockTypeData>({
    resolver: zodResolver(createBlockTypeSchema),
    defaultValues: {
      name: blockType.name,
      description: blockType.description ?? "",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateBlockType({ id: blockType.id, data })}
      isPending={isPending}
      title="Edit Block Type"
      subtitle={blockType.name}
      backHref="/block-types"
      backLabel="Back to List"
    >
      <BlockTypeForm isLoading={isPending} />
    </FormView>
  );
};
