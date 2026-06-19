import { AthleteSessionView } from "@app/modules/athlete-session";

type AthleteSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

const AthleteSessionPage = async ({ params }: AthleteSessionPageProps) => {
  const { sessionId } = await params;

  return <AthleteSessionView sessionId={sessionId} />;
};

export default AthleteSessionPage;
