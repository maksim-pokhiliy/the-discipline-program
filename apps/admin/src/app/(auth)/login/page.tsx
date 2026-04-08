import { SuspenseWrapper } from "@repo/ui";

import { LoginPage } from "@app/modules/auth";

export default function AdminLoginPage() {
  return (
    <SuspenseWrapper>
      <LoginPage />
    </SuspenseWrapper>
  );
}
