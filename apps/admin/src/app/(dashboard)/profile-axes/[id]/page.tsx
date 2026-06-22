import { ProfileAxesEditView } from "@app/modules/profile-axes";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ProfileAxesEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ProfileAxesEditView id={id} />;
};

export default ProfileAxesEditPage;
