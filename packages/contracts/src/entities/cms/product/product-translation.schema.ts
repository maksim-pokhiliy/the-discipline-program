import { z } from "zod";

import { PRODUCT_CONSTANTS } from "./product.constants";
import { productFeatureSchema } from "./product.schema";

export const productTranslationWordsSchema = z.object({
  title: z.string().max(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH),
  description: z.string().max(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  features: z.array(productFeatureSchema),
});
