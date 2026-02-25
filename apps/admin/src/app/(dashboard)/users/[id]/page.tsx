import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { UserDetailView } from "@app/modules/users";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await fetchOrNotFound(() => serverApi.users.getById(id));

  return <UserDetailView initialData={user} />;
}
