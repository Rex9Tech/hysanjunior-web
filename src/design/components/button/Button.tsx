// src/design/components/button/Button.tsx

import React from "react";
import { cn } from "../../helpers";
import {
  ButtonVariant,
  ButtonVariants,
  ComponentSize,
  ComponentSizes,
} from "../../constants";

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ComponentSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * Button variants synced with mobile AppButton
 * (_InteractivePrimaryButton / _InteractiveNeonButton / _InteractiveSecondaryButton).
 *
 * Labels use font-primary (Fredoka): KGSecondChances (font-display) does not color
 * reliably for all Latin/Myanmar runs on web, which made Sign Out / Save look black
 * on day pages while auth (night inheritance) still looked fine.
 */
export const Button: React.FC<IButtonProps> = ({
  variant = ButtonVariants.PRIMARY,
  size = ComponentSizes.MD,
  fullWidth = false,
  isLoading = false,
  disabled = false,
  type = "button",
  href,
  target,
  rel,
  className,
  children,
  ...props
}) => {
  const isNeon = variant === ButtonVariants.NEON && !disabled && !isLoading;

  const variants: Record<ButtonVariant, string> = {
    // Primary — solid fill; label always white on brand red
    [ButtonVariants.PRIMARY]:
      "bg-primary text-secondary-content [-webkit-text-fill-color:var(--color-secondary-content)] font-primary font-bold tracking-[1.2px] hover:bg-primary/90 active:scale-[0.97] active:bg-primary/90 active:shadow-neon transition-all duration-200",

    // Neon — glass idle + glowWhite label; solid primary + neon shadow on press
    [ButtonVariants.NEON]:
      "border border-glass-border bg-glass-card backdrop-blur-md text-glow-white [-webkit-text-fill-color:var(--color-glow-white)] font-primary font-bold tracking-[1.2px] hover:bg-primary hover:border-primary hover:text-primary-content hover:[-webkit-text-fill-color:var(--color-primary-content)] active:scale-[0.97] active:bg-primary active:border-primary active:shadow-neon transition-all duration-200",

    // Secondary — primary outline; label = secondary-content (day black / night white)
    [ButtonVariants.SECONDARY]:
      "border-[1.5px] border-primary bg-transparent text-primary-content [-webkit-text-fill-color:var(--color-primary-content)] font-primary font-semibold hover:bg-primary/15 active:scale-[0.97] active:bg-primary/15 active:shadow-neon transition-all duration-200",

    // Tertiary — text button (mobile osTextButton → primary)
    [ButtonVariants.TERTIARY]:
      "text-primary [-webkit-text-fill-color:var(--color-primary)] font-primary hover:bg-primary/10 active:bg-primary/15 transition-all duration-200",
  };

  // MD = mobile Interactive padding xl/md (20/12) + buttonHeight 48
  const sizes: Partial<Record<ComponentSize, string>> = {
    [ComponentSizes.XS]: "px-2 py-1 text-caption min-h-8",
    [ComponentSizes.SM]: "px-3 py-1.5 text-body-s min-h-10",
    [ComponentSizes.MD]: "px-5 py-3 text-body-m min-h-12",
    [ComponentSizes.LG]: "px-6 py-3.5 text-body-l min-h-14",
    [ComponentSizes.XL]: "px-8 py-4 text-body-l font-bold min-h-16",
  };

  const buttonClasses = cn(
    "inline-flex items-center justify-center whitespace-nowrap select-none",
    "font-medium transition-all duration-200 ease-out",
    "rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40",
    variants[variant],
    sizes[size] || sizes[ComponentSizes.MD],
    fullWidth && "w-full",
    (disabled || isLoading) &&
      "opacity-40 cursor-not-allowed hover:shadow-none active:scale-100 active:shadow-none",
    isLoading && "cursor-wait",
    className,
  );

  const neonBorders = isNeon && (
    <>
      <span className="absolute top-0 -left-full w-full h-px bg-linear-to-r from-transparent to-primary animate-neon-border-1" />
      <span className="absolute -top-full right-0 w-px h-full bg-linear-to-b from-transparent to-primary animate-neon-border-2" />
      <span className="absolute bottom-0 -right-full w-full h-px bg-linear-to-l from-transparent to-primary animate-neon-border-3" />
      <span className="absolute -bottom-full left-0 w-px h-full bg-linear-to-t from-transparent to-primary animate-neon-border-4" />
    </>
  );

  const innerContent = isLoading ? (
    <span className="loading loading-spinner loading-sm" />
  ) : (
    children
  );

  if (href) {
    const isBlank = target === "_blank";
    return (
      <a
        href={href}
        target={target}
        rel={rel || (isBlank ? "noopener noreferrer" : undefined)}
        className={buttonClasses}
        onClick={
          props.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>
        }
      >
        {neonBorders}
        {innerContent}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      {...props}
      className={buttonClasses}
    >
      {neonBorders}
      {innerContent}
    </button>
  );
};
