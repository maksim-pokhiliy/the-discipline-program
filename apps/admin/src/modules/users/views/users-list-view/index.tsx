"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useUsersPageData } from "@app/lib/hooks";

import { UsersListSection } from "../../sections";

export const UsersListView = () => (
  <AdminListView queryResult={useUsersPageData()} loadingMessage="Loading users...">
    {(data) => <UsersListSection users={data.users} />}
  </AdminListView>
);
