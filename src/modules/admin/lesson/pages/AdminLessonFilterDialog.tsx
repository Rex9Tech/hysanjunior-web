import React, { useEffect, useState } from "react";
import {
  Button,
  DateTimePicker,
  Dialog,
  Dropdown,
} from "../../../../design";
import { ButtonVariants } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { ADMIN_LESSON_LEVELS, ADMIN_LESSON_UNITS } from "../constants";
import type { IAdminLessonFilters } from "../types";

interface IAdminLessonFilterDialogProps {
  isOpen: boolean;
  initialFilters: IAdminLessonFilters;
  onClose: () => void;
  onApply: (filters: IAdminLessonFilters) => void;
  onReset: () => void;
}

export const AdminLessonFilterDialog: React.FC<
  IAdminLessonFilterDialogProps
> = ({ isOpen, initialFilters, onClose, onApply, onReset }) => {
  const t = useTranslate();
  const [draft, setDraft] = useState<IAdminLessonFilters>(initialFilters);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => setDraft(initialFilters), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, initialFilters]);

  const levelOptions = [
    { value: "", label: t(AppLocales.Admin.Lessons.Filters.AllLevels) },
    ...ADMIN_LESSON_LEVELS.map((level) => ({ value: level, label: level })),
  ];

  const unitOptions = [
    { value: "", label: t(AppLocales.Admin.Lessons.Filters.AllUnits) },
    ...ADMIN_LESSON_UNITS.map((unit) => ({ value: unit, label: unit })),
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t(AppLocales.Admin.Lessons.Filters.Title)}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant={ButtonVariants.SECONDARY}
            onClick={() => {
              setDraft({ level: "", unit: "", from: "", to: "" });
              onReset();
            }}
          >
            {t(AppLocales.Admin.Common.Actions.ResetFilter)}
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {t(AppLocales.Admin.Common.Actions.ApplyFilter)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Dropdown
          label={t(AppLocales.Admin.Lessons.Filters.Level)}
          value={draft.level}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, level: value }))
          }
          options={levelOptions}
        />
        <Dropdown
          label={t(AppLocales.Admin.Lessons.Filters.Unit)}
          value={draft.unit}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, unit: value }))
          }
          options={unitOptions}
        />
        <DateTimePicker
          type="date"
          label={t(AppLocales.Admin.Lessons.Filters.From)}
          value={draft.from}
          onChange={(utc) =>
            setDraft((current) => ({ ...current, from: utc }))
          }
        />
        <DateTimePicker
          type="date"
          label={t(AppLocales.Admin.Lessons.Filters.To)}
          value={draft.to}
          onChange={(utc) => setDraft((current) => ({ ...current, to: utc }))}
        />
      </div>
    </Dialog>
  );
};
