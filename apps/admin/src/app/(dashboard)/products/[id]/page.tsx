import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { ProductEditView } from "@app/modules/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const product = await api.products.getById(id);

    return <ProductEditView initialData={product} />;
  } catch {
    return notFound();
  }
}
