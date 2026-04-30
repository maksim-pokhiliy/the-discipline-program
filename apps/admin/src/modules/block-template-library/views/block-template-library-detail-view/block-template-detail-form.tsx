"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  updateBlockTemplateInputSchema,
  type BlockTemplate,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";
import { FormView } from "@repo/ui";

import { useUpdateBlockTemplate } from "@app/lib/hooks";

import { BlockTemplateLibraryDetailSection } from "../../sections";

type FormInput = z.input<typeof updateBlockTemplateInputSchema>;

type BlockTemplateDetailFormProps = {
  blockTemplate: BlockTemplate;
};

export const BlockTemplateDetailForm: React.FC<BlockTemplateDetailFormProps> = ({
  blockTemplate,
}) => {
  const { mutate: updateBlockTemplate, isPending } = useUpdateBlockTemplate();

  const methods = useForm<FormInput, unknown, UpdateBlockTemplateInput>({
    resolver: zodResolver(updateBlockTemplateInputSchema),
    defaultValues: {
      name: blockTemplate.name,
      description: blockTemplate.description ?? undefined,
      scope: blockTemplate.scope,
      ownerId: blockTemplate.ownerId,
      payload: blockTemplate.payload as FormInput["payload"],
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateBlockTemplate({ id: blockTemplate.id, data })}
      isPending={isPending}
      title="Edit block template"
      subtitle={blockTemplate.name}
      backHref="/library/block-templates"
      backLabel="Back to Block templates"
    >
      <BlockTemplateLibraryDetailSection blockTemplate={blockTemplate} isPending={isPending} />
    </FormView>
  );
};
