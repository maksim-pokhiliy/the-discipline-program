import { ProductEditView } from "@app/modules/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ProductEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ProductEditView id={id} />;
};

export default ProductEditPage;
