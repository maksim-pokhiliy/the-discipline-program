import { UserDetailView } from "@app/modules/users";

type PageProps = {
  params: Promise<{ id: string }>;
};

const UserDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <UserDetailView id={id} />;
};

export default UserDetailPage;
