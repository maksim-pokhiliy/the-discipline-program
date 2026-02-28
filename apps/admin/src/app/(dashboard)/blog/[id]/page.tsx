import { BlogEditView } from "@app/modules/blog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogEditPage({ params }: PageProps) {
  const { id } = await params;

  return <BlogEditView id={id} />;
}
