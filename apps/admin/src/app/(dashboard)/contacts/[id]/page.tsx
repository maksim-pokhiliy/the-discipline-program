import { ContactsDetailView } from "@app/modules/contacts";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ContactsDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ContactsDetailView id={id} />;
};

export default ContactsDetailPage;
