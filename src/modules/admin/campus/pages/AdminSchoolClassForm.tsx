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
  ADMIN_CAMPUS_LEVELS,
  ADMIN_CAMPUS_STATUS_OPTIONS,
} from "../constants";
import {
  CAMPUS_STATUSES,
  type IAdminSchoolClass,
  type IAdminSchoolClassFormValues,
  type TCampusStatus,
} from "../types";

interface IAdminSchoolClassFormProps {
  mode: typeof ADMIN_ACTIONS.CREATE | typeof ADMIN_ACTIONS.EDIT;
  campusId: string;
  schoolClass?: IAdminSchoolClass | null;
  onSubmit: (values: IAdminSchoolClassFormValues) => void;
  onCancel: () => void;
}

interface IFormState {
  name: string;
  level: string;
  status: TCampusStatus;
}

export const AdminSchoolClassForm: React.FC<IAdminSchoolClassFormProps> = ({
  mode,
  campusId,
  schoolClass,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const [values, setValues] = useState<IFormState>({
    name: schoolClass?.name ?? "",
    level: schoolClass ? String(schoolClass.level) : "",
    status: schoolClass?.status ?? CAMPUS_STATUSES.ACTIVE,
  });
  const [nameError, setNameError] = useState("");
  const [levelError, setLevelError] = useState("");

  const updateValue = <K extends keyof IFormState>(
    field: K,
    value: IFormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let isValid = true;

    if (!values.name.trim()) {
      setNameError(t(AppLocales.Admin.Campuses.ClassForm.NameError));
      isValid = false;
    } else {
      setNameError("");
    }

    if (!values.level) {
      setLevelError(t(AppLocales.Admin.Campuses.ClassForm.LevelError));
      isValid = false;
    } else {
      setLevelError("");
    }

    if (!isValid) return;

    onSubmit({
      campus_id: campusId,
      name: values.name.trim(),
      level: Number(values.level),
      status: values.status,
    });
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <TextInput
        label={t(AppLocales.Admin.Campuses.ClassForm.NameLabel)}
        placeholder={t(AppLocales.Admin.Campuses.ClassForm.NamePlaceholder)}
        value={values.name}
        onChange={(e) => updateValue("name", e.target.value)}
        error={nameError}
        required
      />

      <Dropdown
        label={t(AppLocales.Admin.Campuses.ClassForm.LevelLabel)}
        value={values.level}
        onValueChange={(value) => updateValue("level", value)}
        options={ADMIN_CAMPUS_LEVELS.map((level) => ({
          value: String(level),
          label: t(AppLocales.Admin.Campuses.ClassForm.LevelOption, { level }),
        }))}
        placeholder={t(AppLocales.Admin.Campuses.ClassForm.LevelLabel)}
        error={levelError}
      />

      <Dropdown
        label={t(AppLocales.Admin.Campuses.ClassForm.StatusLabel)}
        value={values.status}
        onValueChange={(value) => updateValue("status", value as TCampusStatus)}
        options={ADMIN_CAMPUS_STATUS_OPTIONS.map((status) => ({
          value: status,
          label: t(AppLocales.Admin.Campuses.Status[status]),
        }))}
        placeholder={t(AppLocales.Admin.Campuses.ClassForm.StatusLabel)}
      />

      <FormActionRow
        onCancel={onCancel}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        submitLabel={
          mode === ADMIN_ACTIONS.CREATE
            ? t(AppLocales.Admin.Campuses.ClassForm.CreateClass)
            : t(AppLocales.Admin.Campuses.ClassForm.SaveClass)
        }
      />
    </FormContainer>
  );
};
