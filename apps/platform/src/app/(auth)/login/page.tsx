import { SuspenseWrapper } from "@repo/ui";

import { PlatformLoginPage } from "@app/modules/auth";

const LoginPage = () => {
  return (
    <SuspenseWrapper>
      <PlatformLoginPage />
    </SuspenseWrapper>
  );
};

export default LoginPage;
