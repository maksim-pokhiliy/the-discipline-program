import { Metadata } from "next";

import { PaymentSuccessPage } from "@app/modules/payment-success";
import { PaymentPageWrapper } from "@app/shared/components/layout";
import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants";

export const metadata: Metadata = {
  title: PAGE_SEO.paymentSuccess.title,
  description: PAGE_SEO.paymentSuccess.description,
  keywords: PAGE_SEO.paymentSuccess.keywords,
  openGraph: {
    title: PAGE_SEO.paymentSuccess.title,
    description: PAGE_SEO.paymentSuccess.description,
    url: `${SEO_CONFIG.siteUrl}/payment/success`,
  },
};

export default function PaymentSuccess() {
  return (
    <PaymentPageWrapper>
      <PaymentSuccessPage />
    </PaymentPageWrapper>
  );
}
