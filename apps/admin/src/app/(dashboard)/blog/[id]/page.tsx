import { BlogEditView } from "@app/modules/blog";

type PageProps = {
  params: Promise<{ id: string }>;
};

const BlogEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <BlogEditView id={id} />;
};

export default BlogEditPage;
