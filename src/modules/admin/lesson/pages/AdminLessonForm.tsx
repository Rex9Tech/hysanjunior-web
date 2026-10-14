import React, { useState } from "react";
import {
  Dropdown,
  FormActionRow,
  FormContainer,
  TextInput,
} from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  ADMIN_LESSON_LEVELS,
  ADMIN_LESSON_STATUS_OPTIONS,
  ADMIN_LESSON_UNITS,
} from "../constants";
import { LESSON_STATUSES, type IAdminLesson, type IAdminLessonFormValues } from "../types";

interface IAdminLessonFormProps {
  mode: typeof ADMIN_ACTIONS.CREATE | typeof ADMIN_ACTIONS.EDIT;
  lesson?: IAdminLesson | null;
  onSubmit: (values: IAdminLessonFormValues) => void;
  onCancel: () => void;
}

interface IAdminLessonFormState {
  title: string;
  level: string;
  unit: string;
  status: string;
}

const emptyValues: IAdminLessonFormState = {
  title: "",
  level: "",
  unit: "",
  status: LESSON_STATUSES.DRAFT,
};

const buildInitialValues = (
  lesson?: IAdminLesson | null,
): IAdminLessonFormState => {
  if (!lesson) return emptyValues;
  return {
    title: lesson.title,
    level: String(lesson.level),
    unit: lesson.unit,
    status: lesson.status,
  };
};

export const AdminLessonForm: React.FC<IAdminLessonFormProps> = ({
  mode,
  lesson,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const [values, setValues] = useState<IAdminLessonFormState>(() =>
    buildInitialValues(lesson),
  );
  const [titleError, setTitleError] = useState("");
  const [levelError, setLevelError] = useState("");
  const [unitError, setUnitError] = useState("");

  const updateValue = <K extends keyof IAdminLessonFormState>(
    field: K,
    value: IAdminLessonFormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let isValid = true;
    if (!values.title.trim()) {
      setTitleError(t(AppLocales.Admin.Lessons.Form.TitleError));
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!values.level) {
      setLevelError(t(AppLocales.Admin.Lessons.Form.LevelError));
      isValid = false;
    } else {
      setLevelError("");
    }

    if (!values.unit) {
      setUnitError(t(AppLocales.Admin.Lessons.Form.UnitError));
      isValid = false;
    } else {
      setUnitError("");
    }

    if (!isValid) return;

    onSubmit({
      title: values.title.trim(),
      level: Number(values.level),
      unit: values.unit,
      status: values.status as IAdminLessonFormValues["status"],
    });
  };

  const levelOptions = ADMIN_LESSON_LEVELS.map((level) => ({
    value: String(level),
    label: t(AppLocales.Admin.Lessons.Form.LevelOption, { level }),
  }));

  const unitOptions = ADMIN_LESSON_UNITS.map((unit) => ({
    value: unit,
    label: unit,
  }));

  const statusOptions = ADMIN_LESSON_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: t(AppLocales.Admin.Lessons.Status[status]),
  }));

  return (
    <FormContainer onSubmit={handleSubmit}>
      <TextInput
        label={t(AppLocales.Admin.Lessons.Form.TitleLabel)}
        placeholder={t(AppLocales.Admin.Lessons.Form.TitlePlaceholder)}
        value={values.title}
        onChange={(e) => updateValue("title", e.target.value)}
        error={titleError}
        required
      />

      <Dropdown
        label={t(AppLocales.Admin.Lessons.Form.LevelLabel)}
        value={values.level}
        onValueChange={(value) => updateValue("level", value)}
        options={levelOptions}
        placeholder={t(AppLocales.Admin.Lessons.Form.LevelLabel)}
        error={levelError}
      />

      <Dropdown
        label={t(AppLocales.Admin.Lessons.Form.UnitLabel)}
        value={values.unit}
        onValueChange={(value) => updateValue("unit", value)}
        options={unitOptions}
        placeholder={t(AppLocales.Admin.Lessons.Form.UnitLabel)}
        error={unitError}
      />

      <Dropdown
        label={t(AppLocales.Admin.Lessons.Form.StatusLabel)}
        value={values.status}
        onValueChange={(value) => updateValue("status", value)}
        options={statusOptions}
        placeholder={t(AppLocales.Admin.Lessons.Form.StatusLabel)}
      />

      <FormActionRow
        onCancel={onCancel}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        submitLabel={
          mode === ADMIN_ACTIONS.CREATE
            ? t(AppLocales.Admin.Lessons.Form.CreateLesson)
            : t(AppLocales.Admin.Lessons.Form.SaveLesson)
        }
      />
    </FormContainer>
  );
};
