import { amountToCents } from "@repo/shared";

import { type ProductFormData } from "./product-form-schema";

export const toProductApiData = (data: ProductFormData) => ({
  ...data,
  price: data.price ? { ...data.price, amountCents: amountToCents(data.price.amount) } : undefined,
});
