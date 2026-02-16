import { api } from "@app/lib/api";
import { UsersListView } from "@app/modules/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const initialData = await api.users.getPageData();

  return <UsersListView initialData={initialData} />;
}
