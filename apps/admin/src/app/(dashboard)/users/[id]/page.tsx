import { api } from "@app/lib/api";
import { fetchOrNotFound } from "@app/lib/fetch-or-not-found";
import { UserDetailView } from "@app/modules/users";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await fetchOrNotFound(() => api.users.getById(id));

  return <UserDetailView initialData={user} />;
}
