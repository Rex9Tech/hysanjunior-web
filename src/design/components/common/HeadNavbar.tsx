import React, { useState } from "react";
import { Link } from "react-router-dom";
import AppConfig from "../../../AppConfig";
import AppRoutes from "../../../AppRoutes";
import { icons, iconsLib } from "../../../assets";
import { FeedbackDialog } from "../../../modules/feedback";
import { Button } from "../button";
import { Asset } from "../media";
import { LanguageDropdown } from "../settings/LanguageDropdown";
import { ThemeToggle } from "../settings/ThemeToggle";
import { ButtonTypes, ButtonVariants, ComponentSizes } from "../../constants";
import { cn } from "../../helpers";
import ProfileAvatar from "./ProfileAvatar";
import { NotificationCenter } from "./NotificationCenter";
import { TimeZoneIndicator } from "./TimeZoneIndicator";

export interface HeadNavbarProps {
  children?: React.ReactNode;
  className?: string;
  isAdmin?: boolean;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  showNotifications?: boolean;
  showFeedback?: boolean;
}

export interface IHeadNavbarBrandProps {
  className?: string;
  isAdmin?: boolean;
  to?: string;
  showText?: boolean;
}

/** Navbar action control styles on primary bar (synced with mobile AppBar). */
const navbarActionClass =
  "text-white hover:bg-white/15 hover:text-white";

export const HeadNavbarBrand: React.FC<IHeadNavbarBrandProps> = ({
  className,
  isAdmin = false,
  to,
  showText = true,
}) => {
  const targetTo =
    to ??
    (isAdmin
      ? AppRoutes.client.protected.admin.HOME
      : AppRoutes.client.protected.HOME);

  return (
    <Link
      to={targetTo}
      className={cn(
        "flex min-w-0 items-center gap-3 select-none no-underline transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={`${AppConfig.APP_NAME} Home`}
    >
      <Asset
        asset={icons.logo}
        className={cn(
          "h-9 w-9 shrink-0 select-none transition-transform duration-300 hover:scale-105",
          isAdmin && "drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]",
        )}
      />
      {showText && (
        <div className="min-w-0">
          <div className="truncate text-body-m font-bold tracking-wide text-white font-display">
            {AppConfig.APP_NAME}
          </div>
          {isAdmin && (
            <div className="truncate text-caption font-medium uppercase tracking-wider text-white">
              Control Center
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

/**
 * App chrome header — synced with mobile AppPage AppBar:
 * background = primary, title/actions = textSecondary (secondary-content: white day / black night).
 */
export const HeadNavbar: React.FC<HeadNavbarProps> = ({
  actions,
  children,
  className,
  isAdmin = false,
  leading,
  showNotifications = true,
  showFeedback = true,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const resolvedLeading =
    leading !== undefined ? leading : !isAdmin ? <HeadNavbarBrand /> : null;

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-primary-dark/40 bg-primary px-4 text-white md:px-6",
          className,
        )}
      >
        {children ?? (
          <>
            <div className="flex min-w-0 items-center gap-3">
              {/* {leading ?? <HeadNavbarBrand showText={false} />} */}
            </div>
            <div className="flex items-center gap-2 text-white">
              <TimeZoneIndicator
                className="border-white/30 bg-white/10 text-white"
              />
              {showFeedback && (
                <Button
                  type={ButtonTypes.BUTTON}
                  variant={ButtonVariants.GLASS}
                  size={ComponentSizes.SM}
                  className={cn(
                    "h-10 w-10 p-0 inline-flex items-center justify-center",
                    navbarActionClass,
                  )}
                  onClick={() => setFeedbackOpen(true)}
                  title="Send Feedback"
                  aria-label="Send Feedback"
                >
                  <iconsLib.feedback className="h-5 w-5 text-base-content/80 hover:text-base-content transition-colors" />
                </Button>
              )}
              {showNotifications && (
                <NotificationCenter triggerClassName={navbarActionClass} />
              )}
              <ThemeToggle className={navbarActionClass} />
              <div className="hidden sm:block">
                <LanguageDropdown className="border-white/30 bg-white/10 text-white focus:border-white focus:ring-white/20 [&_option]:bg-base-100 [&_option]:text-base-content" />
              </div>
              {actions}
              <ProfileAvatar />
            </div>
          </>
        )}
      </header>
      <FeedbackDialog
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
};

export default HeadNavbar;
