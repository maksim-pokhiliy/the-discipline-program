import {
  type CreateBlockTemplateInput,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";

export type BlockTemplateFormValues = CreateBlockTemplateInput & UpdateBlockTemplateInput;
