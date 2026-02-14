import { type Product } from "@repo/contracts/product";

import { apiClient } from "../client";

export const productsAPI = {
  getAll: (): Promise<Product[]> => apiClient.request("/api/public/products"),
};
