"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createBlockTypeSchema,
  type CreateBlockTypeData,
} from "@repo/contracts/library/block-type";
import { FormView } from "@repo/ui";

import { useCreateLibraryBlockType } from "@app/lib/hooks";

import { BlockTypeForm } from "../components";

type CreateBlockTypeInput = z.input<typeof createBlockTypeSchema>;

export const BlockTypeCreateView = () => {
  const { mutate: createBlockType, isPending } = useCreateLibraryBlockType();

  const methods = useForm<CreateBlockTypeInput, unknown, CreateBlockTypeData>({
    resolver: zodResolver(createBlockTypeSchema),
    defaultValues: {
      slug: "",
      name: "",
      description: undefined,
      iconKey: undefined,
      colorKey: undefined,
      sortOrder: 0,
      active: true,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createBlockType(data)}
      isPending={isPending}
      title="Create Block Type"
      subtitle="Add a new workout block category"
      backHref="/library/block-types"
      backLabel="Back to Block Types"
      submitLabel="Create Block Type"
    >
      <BlockTypeForm isLoading={isPending} />
    </FormView>
  );
};
