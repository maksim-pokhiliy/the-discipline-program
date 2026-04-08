import { SuspenseWrapper } from "@repo/ui";

import { AthletesView } from "@app/modules/athletes";

const AthletesPage = () => (
  <SuspenseWrapper>
    <AthletesView />
  </SuspenseWrapper>
);

export default AthletesPage;
