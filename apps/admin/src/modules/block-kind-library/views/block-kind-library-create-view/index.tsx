"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createBlockKindInputSchema,
  type CreateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormView } from "@repo/ui";

import { useCreateBlockKind } from "@app/lib/hooks";

import { BlockKindLibraryForm } from "../../components";

type CreateInput = z.input<typeof createBlockKindInputSchema>;

export const BlockKindLibraryCreateView = () => {
  const { mutate: createBlockKind, isPending } = useCreateBlockKind();

  const methods = useForm<CreateInput, unknown, CreateBlockKindInput>({
    resolver: zodResolver(createBlockKindInputSchema),
    defaultValues: {
      scope: "COACH",
      name: "",
      description: undefined,
      iconKey: undefined,
      defaultWeight: 1,
      defaultArchetypeKind: undefined,
      analyticsCategory: undefined,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createBlockKind(data)}
      isPending={isPending}
      title="Create block kind"
      subtitle="Add a new entry to the block kind library"
      backHref="/library/block-kinds"
      backLabel="Back to Block kinds"
      submitLabel="Create block kind"
    >
      <BlockKindLibraryForm isLoading={isPending} />
    </FormView>
  );
};
