import { LoginPage } from "@app/modules/auth";
import { SuspenseWrapper } from "@app/shared/components/layout";

export default function Page() {
  return (
    <SuspenseWrapper>
      <LoginPage />
    </SuspenseWrapper>
  );
}
