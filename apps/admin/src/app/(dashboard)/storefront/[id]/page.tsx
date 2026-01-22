import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { StorefrontEditView } from "@app/modules/storefront";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function StorefrontEditPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const product = await api.storefront.getById(id);

    return <StorefrontEditView initialData={product} />;
  } catch {
    return notFound();
  }
}
