import { serverApi } from "@app/lib/api/server";
import { ProductsListView } from "@app/modules/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const initialData = await serverApi.products.getPageData();

  return <ProductsListView initialData={initialData} />;
}
