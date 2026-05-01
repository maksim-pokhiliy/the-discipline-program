import { type SectionSeed } from "./types";

export const CONTACT_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "contact",
    section: "contact:hero",
    data: {
      title: "Drop Us A Line",
      subtitle: "We love talking training.",
      buttonText: "Get In Touch",
      buttonHref: "#contact-form",
      backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80",
    },
  },
  {
    pageSlug: "contact",
    section: "contact:form",
    data: {
      title: "Send Us a Message",
      subtitle: "Tell us about your goals and we'll craft the perfect plan",
      successTitle: "Message Sent!",
      successMessage: "Thank you for reaching out. We'll get back to you shortly.",
      submitLabel: "Send Message",
      sendAnotherLabel: "Send Another",
      sendingLabel: "Sending...",
      errorMessage: "Something went wrong",
      fieldLabels: {
        name: "Name",
        contact: "Phone / Telegram / WhatsApp",
        program: "Program Interest",
        message: "Your Message",
      },
      fieldPlaceholders: {
        contact: "+380..., @username",
        message: "Tell us about your goals...",
      },
    },
  },
];
