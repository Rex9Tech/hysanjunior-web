// src/design/elements/colors.ts

/**
 * Hysan Junior colors — synced with mobile AppColors.
 */

export const colors = {
  // Brand (synced with mobile)
  primary: "#ea2a33",
  primaryLight: "#FF5263",
  primaryDark: "#CC1125",
  secondary: "#ffce30",
  accent: "#FF0D2D",

  // Neon Glow Colors
  glowWhite: "#FFF2F4",
  glowOuter: "#5C0916",

  // Shadow color tokens
  shadows: {
    blackXs: "rgba(0, 0, 0, 0.08)",
    blackSm: "rgba(0, 0, 0, 0.08)",
    blackMd: "rgba(0, 0, 0, 0.10)",
    glow: "rgba(234, 42, 51, 0.4)",
    glassCard: "rgba(234, 42, 51, 0.35)",
    glassHover: "rgba(234, 42, 51, 0.45)",
    textDark: "rgba(0, 0, 0, 0.9)",
  },

  // Semantic (Unified across Light & Dark themes)
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#38BDF8",
  },

  // Text tokens — synced with mobile AppDayColors / AppNightColors
  text: {
    day: {
      primary: "#000000",
      primaryRgb: "0, 0, 0",
      secondary: "#FFFFFF",
      muted: "#9CA3AF",
    },
    night: {
      primary: "#FFFFFF",
      primaryRgb: "255, 255, 255",
      secondary: "#000000",
      muted: "#A39298",
    },
  },

  // Day Theme (cream canvas — synced with mobile)
  day: {
    primary: "#ea2a33",
    primaryRgb: "234, 42, 51",
    primaryLight: "#FF5263",
    primaryDark: "#CC1125",
    background: "#FAFAF8",
    backgroundGradient: "linear-gradient(to bottom right, #FFF6D2, #FFF4CF)",
    surface: "#FFFDF8",
    card: "#FFFDF8",
    border: "#ea2a33",
    divider: "#F3F4F6",
    textPrimary: "#000000",
    textSecondary: "#FFFFFF",
    textMuted: "#9CA3AF",
    glowWhite: "#FFF2F4",
    glowOuter: "#5C0916",
    glowOuterRgb: "92, 9, 22",
  },

  // Night Theme (synced surfaces with mobile)
  night: {
    primary: "#ea2a33",
    primaryRgb: "234, 42, 51",
    primaryLight: "#FF5263",
    primaryDark: "#CC1125",
    background: "#160b11",
    backgroundGradient: "none",
    surface: "#1f1018",
    card: "#26131e",
    border: "#3d1b28",
    divider: "#2c111c",
    textPrimary: "#FFFFFF",
    textSecondary: "#000000",
    textMuted: "#A39298",
    glowWhite: "#FFF2F4",
    glowOuter: "#5C0916",
    glowOuterRgb: "92, 9, 22",
  },

  // Glassmorphism (primary-tinted with HJ red)
  glass: {
    nav: "rgba(22, 7, 13, 0.75)",
    card: "rgba(35, 12, 20, 0.38)",
    cardHover: "rgba(50, 16, 28, 0.55)",
    form: "rgba(28, 8, 16, 0.65)",
    project: "rgba(18, 6, 12, 0.55)",
    projectHover: "rgba(22, 7, 15, 0.75)",
    border: "rgba(234, 42, 51, 0.22)",
    borderHover: "rgba(234, 42, 51, 0.55)",
    tag: "rgba(234, 42, 51, 0.65)",
    tagBg: "rgba(234, 42, 51, 0.08)",
    tagBgHover: "rgba(234, 42, 51, 0.28)",
  },

  // Centralized Glow & Text Shadow Effects
  effects: {
    heroSign:
      "0 0 0.6rem var(--color-glow-white), 0 0 1.5rem var(--color-primary), -0.2rem 0.1rem 1rem var(--color-primary), 0.2rem 0.1rem 1rem var(--color-primary), 0 -0.5rem 2rem var(--color-primary-dark), 0 0.5rem 3rem var(--color-primary-dark)",
    headingGlow:
      "0 0 0.6rem var(--color-glow-white), 0 0 1.5rem var(--color-primary), -0.2rem 0.1rem 1rem var(--color-primary), 0.2rem 0.1rem 1rem var(--color-primary), 0 -0.5rem 2rem var(--color-primary-dark), 0 0.5rem 3rem var(--color-primary-dark)",
    cardHeading:
      "0 0 6px var(--color-glow-white), 0 0 12px var(--color-primary), 0 0 18px var(--color-primary-dark)",
    navActive:
      "0 0 6px var(--color-glow-white), 0 0 12px var(--color-primary), 0 0 16px var(--color-primary-dark), 0 0 22px var(--color-glow-outer)",
    flickerFull:
      "-1px -1px 0px var(--color-glow-white), 1px 1px 0px var(--color-glow-white), 0 0 10px var(--color-glow-white), 0 0 20px var(--color-primary), 0 0 30px var(--color-primary), 0 0 40px var(--color-primary), 0 0 50px var(--color-primary-dark), 0 0 70px var(--color-primary-dark), 0 0 80px var(--color-glow-outer), 0 0 100px var(--color-glow-outer)",
  },
} as const;

export const BrandColors = {
  PRIMARY: "primary",
  PRIMARY_LIGHT: "primaryLight",
  PRIMARY_DARK: "primaryDark",
  SECONDARY: "secondary",
  ACCENT: "accent",
} as const;

export type BrandColorKey = (typeof BrandColors)[keyof typeof BrandColors];
export type SemanticColorKey = keyof typeof colors.semantic;
export type GlassTokenKey = keyof typeof colors.glass;
export type EffectTokenKey = keyof typeof colors.effects;
