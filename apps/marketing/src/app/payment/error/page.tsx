import { type Metadata } from "next";

import { SuspenseWrapper } from "@repo/ui";

import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
import { PaymentErrorPage } from "@app/modules/payment-error";

export const metadata: Metadata = {
  title: PAGE_SEO.paymentError.title,
  description: PAGE_SEO.paymentError.description,
  keywords: PAGE_SEO.paymentError.keywords,
  robots: { index: false, follow: false },
  openGraph: {
    title: PAGE_SEO.paymentError.title,
    description: PAGE_SEO.paymentError.description,
    url: `${SEO_CONFIG.siteUrl}/payment/error`,
  },
};

export const dynamic = "force-dynamic";

export default function PaymentError() {
  return (
    <SuspenseWrapper>
      <PaymentErrorPage />
    </SuspenseWrapper>
  );
}
