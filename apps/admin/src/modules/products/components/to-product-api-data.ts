import { amountToCents } from "@repo/contracts/common";

import { type ProductFormData } from "./product-form-schema";

export const toProductApiData = (data: ProductFormData) => {
  if (!data.price) {
    return { ...data, price: undefined };
  }

  const { amount, ...rest } = data.price;

  return { ...data, price: { ...rest, amountCents: amountToCents(amount) } };
};
