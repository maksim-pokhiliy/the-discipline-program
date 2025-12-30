import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { PaymentPageWrapper } from "@repo/ui";
import { Metadata } from "next";

import { PaymentErrorPage } from "@app/modules/payment-error";

export const metadata: Metadata = {
  title: PAGE_SEO.paymentError.title,
  description: PAGE_SEO.paymentError.description,
  keywords: PAGE_SEO.paymentError.keywords,
  openGraph: {
    title: PAGE_SEO.paymentError.title,
    description: PAGE_SEO.paymentError.description,
    url: `${SEO_CONFIG.siteUrl}/payment/error`,
  },
};

export default function PaymentError() {
  return (
    <PaymentPageWrapper>
      <PaymentErrorPage />
    </PaymentPageWrapper>
  );
}
