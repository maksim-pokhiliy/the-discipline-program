import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { UserDetailView } from "@app/modules/users";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const user = await api.users.getById(id);

    return <UserDetailView initialData={user} />;
  } catch {
    return notFound();
  }
}
