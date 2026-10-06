// src/modules/landing/components/CandleQuoteCard.tsx

import React from "react";

export interface ICandleQuoteCardProps {
  className?: string;
}

export const CandleQuoteCard: React.FC<ICandleQuoteCardProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl bg-glass-card/90 backdrop-blur-xl border border-glass-border p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500 hover:border-glass-border-hover hover:shadow-[0_0_35px_rgba(var(--color-primary-rgb),0.35)] text-center ${className}`}
    >
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary-dark/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] text-2xl select-none">
          🕯️
        </div>

        <blockquote className="font-display text-base sm:text-lg text-glow-white [text-shadow:0_0_6px_var(--color-glow-white),0_0_15px_rgba(var(--color-primary-rgb),0.7),0_0_30px_rgba(var(--color-primary-rgb),0.4)] italic leading-relaxed tracking-wide px-2 sm:px-4">
          &ldquo;Sharing is like lighting candles from one candle to another:
          sharing one&apos;s light does not make its own flame dimmer or weaker,
          but the world illuminates more and more with each light shared.&rdquo;{" "}
          <br />
          <br />
          &ldquo;making the world more and more beautiful... one light at a
          time...&rdquo;
        </blockquote>

        <p className="text-xs sm:text-sm text-primary-light font-medium tracking-wide">
          — Htet Naing (Rex9) · The Essence of Kindful Open Source
        </p>
      </div>
    </div>
  );
};
