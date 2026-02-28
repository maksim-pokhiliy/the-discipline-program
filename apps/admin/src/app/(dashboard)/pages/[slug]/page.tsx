import { PagesEditView } from "@app/modules/pages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PageEditPage({ params }: PageProps) {
  const { slug } = await params;

  return <PagesEditView slug={slug} />;
}
