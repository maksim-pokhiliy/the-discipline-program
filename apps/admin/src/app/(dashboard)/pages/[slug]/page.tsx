import { PagesEditView } from "@app/modules/pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const PageEditPage = async ({ params }: PageProps) => {
  const { slug } = await params;

  return <PagesEditView slug={slug} />;
};

export default PageEditPage;
