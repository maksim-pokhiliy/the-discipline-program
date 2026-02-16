"use client";

import { type GetUsersPageDataResponse } from "@repo/contracts/user";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useUsersPageData } from "@app/lib/hooks";

import { UsersListSection } from "../../sections";

interface UsersListViewProps {
  initialData: GetUsersPageDataResponse;
}

export const UsersListView = ({ initialData }: UsersListViewProps) => (
  <AdminListView queryResult={useUsersPageData({ initialData })} loadingMessage="Loading users...">
    {(data) => <UsersListSection users={data.users} />}
  </AdminListView>
);
