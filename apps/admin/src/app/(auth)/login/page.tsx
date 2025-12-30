import { SuspenseWrapper } from "@repo/ui";

import { LoginPage } from "@app/modules/auth";

export default function Page() {
  return (
    <SuspenseWrapper>
      <LoginPage />
    </SuspenseWrapper>
  );
}
