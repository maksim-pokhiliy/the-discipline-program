"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createBlockTemplateInputSchema,
  type CreateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";
import { FormView } from "@repo/ui";

import { useCreateBlockTemplate } from "@app/lib/hooks";

import { BlockTemplateLibraryForm } from "../../components";
import { buildDefaultPayload } from "../../components/block-template-library-form/payload-builder/defaults";

type CreateInput = z.input<typeof createBlockTemplateInputSchema>;

type BlockTemplateCreateFormProps = {
  initialKindId: string;
};

export const BlockTemplateCreateForm = ({ initialKindId }: BlockTemplateCreateFormProps) => {
  const { mutate: createBlockTemplate, isPending } = useCreateBlockTemplate();

  const methods = useForm<CreateInput, unknown, CreateBlockTemplateInput>({
    resolver: zodResolver(createBlockTemplateInputSchema),
    defaultValues: {
      scope: "COACH",
      ownerId: null,
      name: "",
      description: undefined,
      payload: buildDefaultPayload(initialKindId) as CreateInput["payload"],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createBlockTemplate(data)}
      isPending={isPending}
      title="Create block template"
      subtitle="Compose a block tree from scratch (block kind + segments + entries)"
      backHref="/library/block-templates"
      backLabel="Back to Block templates"
      submitLabel="Create block template"
    >
      <BlockTemplateLibraryForm isLoading={isPending} mode="create" />
    </FormView>
  );
};
