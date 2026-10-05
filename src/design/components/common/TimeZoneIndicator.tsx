import React from "react";
import { iconsLib } from "../../../assets";
import { useBrowserTimeZone } from "../../../hooks";
import { AppLocales, useTranslate } from "../../../locales";
import { cn } from "../../helpers";

export const TimeZoneIndicator: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { timeZone, utcOffset } = useBrowserTimeZone();
  const t = useTranslate();
  const label = t(AppLocales.Common.LocalTimeZone);

  return (
    <div
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-2 text-caption font-semibold text-base-content/70 sm:px-2.5",
        className,
      )}
      title={`${label}: ${timeZone} (${utcOffset})`}
      aria-label={`${label}: ${timeZone}, ${utcOffset}`}
    >
      <iconsLib.clock className="h-4 w-4 shrink-0" />
      <span>{utcOffset}</span>
      <span className="hidden xl:inline">· {timeZone}</span>
    </div>
  );
};
