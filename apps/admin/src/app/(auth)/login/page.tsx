import { SuspenseWrapper } from "@repo/ui";

import { LoginPage } from "@app/modules/auth";

const AdminLoginPage = () => (
  <SuspenseWrapper>
    <LoginPage />
  </SuspenseWrapper>
);

export default AdminLoginPage;
