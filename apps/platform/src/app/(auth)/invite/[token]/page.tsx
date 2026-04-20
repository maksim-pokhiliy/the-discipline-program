import { iamInviteTokenApi } from "@repo/api-server/iam";
import { GoneError } from "@repo/errors";

import { InviteInvalidView, InviteView } from "@app/modules/invite";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

const InvitePage = async ({ params }: InvitePageProps) => {
  const { token } = await params;

  try {
    const invite = await iamInviteTokenApi.validate(token);

    return <InviteView token={token} invite={invite} />;
  } catch (error) {
    if (error instanceof GoneError) {
      return <InviteInvalidView />;
    }

    throw error;
  }
};

export default InvitePage;
