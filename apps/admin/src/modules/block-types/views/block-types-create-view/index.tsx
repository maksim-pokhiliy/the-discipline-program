"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createBlockTypeSchema, type CreateBlockTypeData } from "@repo/contracts/lms/block-type";
import { FormView } from "@repo/ui";

import { useCreateBlockType } from "@app/lib/hooks";

import { BlockTypeForm } from "../../components";

type CreateBlockTypeInput = z.input<typeof createBlockTypeSchema>;

export const BlockTypesCreateView = () => {
  const { mutate: createBlockType, isPending } = useCreateBlockType();

  const methods = useForm<CreateBlockTypeInput, unknown, CreateBlockTypeData>({
    resolver: zodResolver(createBlockTypeSchema),
    defaultValues: {
      name: "",
      description: null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createBlockType(data)}
      isPending={isPending}
      title="Create Block Type"
      subtitle="Add a new block category to the library"
      backHref="/block-types"
      backLabel="Back to List"
      submitLabel="Create Block Type"
    >
      <BlockTypeForm isLoading={isPending} />
    </FormView>
  );
};
