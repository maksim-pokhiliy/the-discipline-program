import { iamPasswordResetApi } from "@repo/api-server/iam";
import { GoneError } from "@repo/errors";

import { ResetPasswordInvalidView, ResetPasswordView } from "@app/modules/password-reset";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

const ResetPasswordPage = async ({ params }: ResetPasswordPageProps) => {
  const { token } = await params;

  try {
    const { email } = await iamPasswordResetApi.validate(token);

    return <ResetPasswordView token={token} email={email} />;
  } catch (error) {
    if (error instanceof GoneError) {
      return <ResetPasswordInvalidView />;
    }

    throw error;
  }
};

export default ResetPasswordPage;
