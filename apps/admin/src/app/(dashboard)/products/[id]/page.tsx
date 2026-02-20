import { api } from "@app/lib/api";
import { fetchOrNotFound } from "@app/lib/fetch-or-not-found";
import { ProductEditView } from "@app/modules/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchOrNotFound(() => api.products.getById(id));

  return <ProductEditView initialData={product} />;
}
