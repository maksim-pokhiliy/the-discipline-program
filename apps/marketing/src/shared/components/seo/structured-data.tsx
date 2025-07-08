import { Program, Review } from "@repo/api";

import { generateStructuredData } from "@app/shared/utils/seo-utils";

interface StructuredDataProps {
  type: "website" | "organization" | "article" | "programs" | "reviews" | "faq" | "person";
  data?: {
    title?: string;
    description?: string;
    image?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    url?: string;
    programs?: Program[];
    reviews?: Review[];
    faqItems?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

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
