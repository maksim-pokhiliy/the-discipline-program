import { serverApi } from "@app/lib/api/server";
import { UsersListView } from "@app/modules/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const initialData = await serverApi.users.getPageData();

  return <UsersListView initialData={initialData} />;
}
