import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminProductDetails,
  type AdminProductListItem,
  type AdminProduct,
  type AdminProductsPageData,
  type CreateProductData,
  type UpdateProductData,
} from "@repo/contracts/cms/product";

export type CmsProductAdminApi = {
  getAll(): Promise<AdminProductListItem[]>;
  getById(id: string, locale?: LocaleCode): Promise<AdminProductDetails>;
  getPageData(): Promise<AdminProductsPageData>;
  create(data: CreateProductData): Promise<AdminProduct>;
  update(id: string, data: UpdateProductData): Promise<AdminProduct>;
  delete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<AdminProduct>;
  toggleFeatured(id: string): Promise<AdminProduct>;
};
