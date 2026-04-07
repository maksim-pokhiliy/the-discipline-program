import { SuspenseWrapper } from "@repo/ui";

import { AthletesView } from "@app/modules/athletes";

export default function AthletesPage() {
  return (
    <SuspenseWrapper>
      <AthletesView />
    </SuspenseWrapper>
  );
}
