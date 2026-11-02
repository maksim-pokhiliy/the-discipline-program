import {
  PageSlug,
  type siteErrorsSchema,
  type siteFooterSchema,
  type siteLeadFormSchema,
  type siteNavigationSchema,
} from "@repo/contracts/cms/pages";

import { type FieldGroup } from "../components/sections/flat-fields-section-form.types";

import { type FieldsOf, type RemainingFields } from "./schema-fields.types";

const navigationLinks = {
  [PageSlug.HOME]: { label: "Home Link" },
  [PageSlug.STOREFRONT]: { label: "Storefront Link" },
  [PageSlug.ABOUT]: { label: "About Link" },
  [PageSlug.BLOG]: { label: "Blog Link" },
  [PageSlug.FAQ]: { label: "FAQ Link" },
  [PageSlug.CONTACT]: { label: "Contact Link" },
  [PageSlug.OFFER]: { label: "Offer Link" },
} satisfies Partial<FieldsOf<typeof siteNavigationSchema>>;

const navigationControls = {
  navigationLabel: { label: "Navigation Region Name" },
  openMenuLabel: { label: "Open-Menu Button" },
  closeMenuLabel: { label: "Close-Menu Button" },
  languageSwitchLabel: { label: "Language Switcher" },
} satisfies RemainingFields<FieldsOf<typeof siteNavigationSchema>, keyof typeof navigationLinks>;

export const SITE_NAVIGATION_GROUPS = [
  { heading: "Links", fields: navigationLinks },
  { heading: "Screen Reader Labels", fields: navigationControls },
] satisfies readonly FieldGroup[];

const footerFields = {
  tagline: { label: "Tagline" },
  subcopy: { label: "Closing Line" },
  rightsLabel: { label: "Copyright Notice" },
} satisfies FieldsOf<typeof siteFooterSchema>;

export const SITE_FOOTER_GROUPS = [{ fields: footerFields }] satisfies readonly FieldGroup[];

const leadFormFields = {
  title: { label: "Form Title" },
  productPrefix: { label: "Selected Program Prefix" },
  nameLabel: { label: "Name Field Label" },
  contactLabel: { label: "Contact Field Label" },
  messageLabel: { label: "Message Field Label" },
  submitLabel: { label: "Submit Button Label" },
  sendingLabel: { label: "Submit Button Label While Sending" },
} satisfies Partial<FieldsOf<typeof siteLeadFormSchema>>;

const leadFormMessages = {
  successTitle: { label: "Success Title" },
  successMessage: { label: "Success Message", isMultiline: true },
  sendAnotherLabel: { label: "New Request Button Label" },
  errorMessage: { label: "Submit Error Message" },
  contactRequiredMessage: { label: "Missing Contact Message" },
} satisfies RemainingFields<FieldsOf<typeof siteLeadFormSchema>, keyof typeof leadFormFields>;

export const SITE_LEAD_FORM_GROUPS = [
  { heading: "Form", fields: leadFormFields },
  { heading: "Messages", fields: leadFormMessages },
] satisfies readonly FieldGroup[];

const notFoundFields = {
  notFoundTitle: { label: "Not Found Title" },
} satisfies Partial<FieldsOf<typeof siteErrorsSchema>>;

const errorFields = {
  errorGlyph: { label: "Error Heading" },
  errorTitle: { label: "Error Title" },
  errorIdLabel: { label: "Error ID Prefix" },
  retryLabel: { label: "Retry Button Label" },
} satisfies Partial<
  RemainingFields<FieldsOf<typeof siteErrorsSchema>, keyof typeof notFoundFields>
>;

const sharedErrorFields = {
  homeLabel: { label: "Home Button Label" },
} satisfies RemainingFields<
  FieldsOf<typeof siteErrorsSchema>,
  keyof typeof notFoundFields | keyof typeof errorFields
>;

export const SITE_ERRORS_GROUPS = [
  { heading: "Not Found Page", fields: notFoundFields },
  { heading: "Error Page", fields: errorFields },
  { heading: "Both Pages", fields: sharedErrorFields },
] satisfies readonly FieldGroup[];
