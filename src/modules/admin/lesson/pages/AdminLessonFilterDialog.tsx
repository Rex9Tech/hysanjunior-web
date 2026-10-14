import React, { useEffect, useState } from "react";
import { Button, Dialog } from "../../../../design";
import { ButtonVariants } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { Dropdown } from "../../components";
import {
  ADMIN_LESSON_LEVELS,
  ADMIN_LESSON_STATUS_OPTIONS,
  ADMIN_LESSON_UNITS,
} from "../constants";
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
  const [filters, setFilters] = useState<IAdminLessonFilters>(initialFilters);

  useEffect(() => {
    if (isOpen) setFilters(initialFilters);
  }, [isOpen, initialFilters]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t(AppLocales.Admin.Lessons.Filters.Title)}
      className="max-w-md"
      footer={
        <div className="flex w-full justify-between gap-2">
          <Button variant={ButtonVariants.TERTIARY} onClick={onReset}>
            {t(AppLocales.Admin.Common.Actions.ResetFilter)}
          </Button>
          <div className="flex gap-2">
            <Button variant={ButtonVariants.TERTIARY} onClick={onClose}>
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => {
                onApply(filters);
                onClose();
              }}
            >
              {t(AppLocales.Admin.Common.Actions.ApplyFilter)}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Dropdown
          label={t(AppLocales.Admin.Lessons.Filters.Status)}
          value={filters.status}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, status: value }))
          }
          options={[
            {
              value: "",
              label: t(AppLocales.Admin.Lessons.Filters.AllStatuses),
            },
            ...ADMIN_LESSON_STATUS_OPTIONS.map((status) => ({
              value: status,
              label: t(AppLocales.Admin.Lessons.Status[status]),
            })),
          ]}
        />
        <Dropdown
          label={t(AppLocales.Admin.Lessons.Filters.Level)}
          value={filters.level}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, level: value }))
          }
          options={[
            {
              value: "",
              label: t(AppLocales.Admin.Lessons.Filters.AllLevels),
            },
            ...ADMIN_LESSON_LEVELS.map((level) => ({
              value: String(level),
              label: t(AppLocales.Admin.Lessons.Form.LevelOption, { level }),
            })),
          ]}
        />
        <Dropdown
          label={t(AppLocales.Admin.Lessons.Filters.Unit)}
          value={filters.unit}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, unit: value }))
          }
          options={[
            {
              value: "",
              label: t(AppLocales.Admin.Lessons.Filters.AllUnits),
            },
            ...ADMIN_LESSON_UNITS.map((unit) => ({
              value: unit,
              label: unit,
            })),
          ]}
        />
      </div>
    </Dialog>
  );
};
