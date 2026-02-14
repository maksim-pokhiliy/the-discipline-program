import { api } from "@app/lib/api";
import { ProductsListView } from "@app/modules/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const initialData = await api.products.getPageData();

  return <ProductsListView initialData={initialData} />;
}
