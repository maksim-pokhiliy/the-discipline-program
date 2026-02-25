import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { ProductEditView } from "@app/modules/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchOrNotFound(() => serverApi.products.getById(id));

  return <ProductEditView initialData={product} />;
}
