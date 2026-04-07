import { generateStructuredData } from "@app/lib/utils/seo-utils";

type StructuredDataProps = {
  type: Parameters<typeof generateStructuredData>[0];
  data?: Parameters<typeof generateStructuredData>[1];
};

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  const structuredData = generateStructuredData(type, data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
};
