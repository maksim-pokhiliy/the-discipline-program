import { type ApiClient } from "@repo/api-client";
import { type Product } from "@repo/contracts/product";

export const createProductsAPI = (client: ApiClient) => ({
  getAll: (): Promise<Product[]> => client.request("/api/public/products"),
});
