// src/modules/landing/components/LandingFooter.tsx

import React from "react";
import { LANDING_DATA } from "../constants";
import { SocialProfiles } from "./SocialProfiles";
import { TextLink } from "../../../design";
import AppRoutes from "../../../AppRoutes";

export type LandingFooterPage = "home" | "vs" | "privacy" | "terms";

export interface ILandingFooterProps {
  activePage?: LandingFooterPage;
}

export const LandingFooter: React.FC<ILandingFooterProps> = ({
  activePage = "home",
}) => {
  return (
    <div className="w-full">
      {/* Glowing Divider matching Rex9 / LandingPage source of truth */}
      <div className="w-4/5 max-w-5xl h-px mx-auto my-9 bg-linear-to-r from-transparent via-primary to-transparent shadow-[0_0_6px_rgba(var(--color-primary-rgb),0.3)]" />

      {/* Footer Content with standard 80px (pb-20) ground truth bottom breathing room */}
      <footer className="text-center space-y-3 pb-20">
        <SocialProfiles profiles={LANDING_DATA.profiles} />
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-base-content/60 font-medium">
          <TextLink
            to={AppRoutes.client.public.ROOT}
            className={`text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline ${
              activePage === "home" ? "font-semibold text-primary!" : ""
            }`}
          >
            RexOne Home
          </TextLink>
          <span className="text-base-content/30">•</span>
          <TextLink
            to={AppRoutes.client.public.VS}
            className={`text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline ${
              activePage === "vs" ? "font-semibold text-primary!" : ""
            }`}
          >
            VS Page
          </TextLink>
          <span className="text-base-content/30">•</span>
          <TextLink
            to={`${AppRoutes.client.public.VS}#faq`}
            className="text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline"
          >
            Comparison FAQs
          </TextLink>
          <span className="text-base-content/30">•</span>
          <a
            href={
              activePage === "home"
                ? "#FAQ"
                : `${AppRoutes.client.public.ROOT}#FAQ`
            }
            className="text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline"
          >
            General FAQs
          </a>
          <span className="text-base-content/30">•</span>
          <TextLink
            to={AppRoutes.client.public.PRIVACY_POLICY}
            className={`text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline ${
              activePage === "privacy" ? "font-semibold text-primary!" : ""
            }`}
          >
            Privacy Policy
          </TextLink>
          <span className="text-base-content/30">•</span>
          <TextLink
            to={AppRoutes.client.public.TERMS_AND_CONDITIONS}
            className={`text-base-content/60 hover:text-primary transition-colors text-xs tracking-wider no-underline hover:underline ${
              activePage === "terms" ? "font-semibold text-primary!" : ""
            }`}
          >
            Terms & Conditions
          </TextLink>
        </div>
        <p className="text-xs text-base-content/50 font-medium">
          © {new Date().getFullYear()} Rex9. Engineered with Soul & Clarity.
        </p>
      </footer>
    </div>
  );
};

export default LandingFooter;
