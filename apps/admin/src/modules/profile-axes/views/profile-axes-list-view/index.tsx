"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useProfileAxesPageData } from "@app/lib/hooks";

import { ProfileAxesListSection } from "../../sections";

export const ProfileAxesListView = () => (
  <AdminListView
    queryResult={useProfileAxesPageData()}
    loadingMessage="Loading profile axes..."
    title="Profile Axes"
    subtitle="Coach library of training-classification axes"
  >
    {(data) => <ProfileAxesListSection profileAxes={data.profileAxes} />}
  </AdminListView>
);
