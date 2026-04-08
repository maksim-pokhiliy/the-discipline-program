import { UserDetailView } from "@app/modules/users";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <UserDetailView id={id} />;
}
