// src/design/constants/form.constants.ts

/**
 * RexOne Design System - Form & Input Constants
 */

export const InputVariants = {
  DEFAULT: "default",
  GLASS: "glass",
} as const;

export type InputVariant = (typeof InputVariants)[keyof typeof InputVariants];

export const FormVariants = {
  DEFAULT: "default",
  GLASS: "glass",
} as const;

export type FormVariant = (typeof FormVariants)[keyof typeof FormVariants];

export const InputTypes = {
  TEXT: "text",
  EMAIL: "email",
  PASSWORD: "password",
  NUMBER: "number",
  TEL: "tel",
  URL: "url",
  SEARCH: "search",
} as const;

export type InputType = (typeof InputTypes)[keyof typeof InputTypes];
