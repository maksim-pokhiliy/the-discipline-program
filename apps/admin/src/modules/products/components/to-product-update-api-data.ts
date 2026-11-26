import { type UpdateProductData } from "@repo/contracts/cms/product";

import { type ProductFormData } from "./product-form-schema";
import { toProductApiData } from "./to-product-api-data";

export const toProductUpdateApiData = (
  data: ProductFormData,
  isImageDirty: boolean,
): UpdateProductData => {
  const { imageUrl, ...update } = toProductApiData(data);

  return isImageDirty ? { ...update, imageUrl } : update;
};
