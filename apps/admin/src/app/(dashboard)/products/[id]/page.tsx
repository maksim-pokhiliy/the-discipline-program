import { ProductEditView } from "@app/modules/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;

  return <ProductEditView id={id} />;
}
