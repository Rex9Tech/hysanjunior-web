import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dropdown,
  FormActionRow,
  FormContainer,
  TextInput,
} from "../../components";
import { AppLocales, useTranslate } from "../../../../locales";
import CampusController from "../../campus/campus.controller";
import SchoolClassController from "../../campus/school_class.controller";
import type { IAdminCampus, IAdminSchoolClass } from "../../campus/types";
import type { IAdminTeacherCreateFormValues } from "../types";

interface IAdminTeacherFormProps {
  onSubmit: (values: IAdminTeacherCreateFormValues) => Promise<void>;
  onCancel: () => void;
}

interface IIdentityState {
  username: string;
  name: string;
  email: string;
}

const emptyIdentity = (): IIdentityState => ({
  username: "",
  name: "",
  email: "",
});

export const AdminTeacherForm: React.FC<IAdminTeacherFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const [searchParams] = useSearchParams();

  const [teacher, setTeacher] = useState<IIdentityState>(emptyIdentity);
  const [campuses, setCampuses] = useState<IAdminCampus[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<IAdminSchoolClass[]>([]);
  const [campusId, setCampusId] = useState(searchParams.get("campus_id") || "");
  const [schoolClassId, setSchoolClassId] = useState(
    searchParams.get("school_class_id") || "",
  );
  const [teacherErrors, setTeacherErrors] = useState<Partial<IIdentityState>>(
    {},
  );
  const [campusError, setCampusError] = useState("");

  const loadCampuses = useCallback(async () => {
    const result = await CampusController.getCampuses({
      limit: 100,
      status: "active",
    });
    if (result.success) setCampuses(result.campuses);
  }, []);

  const loadClasses = useCallback(async (selectedCampusId: string) => {
    if (!selectedCampusId) {
      setSchoolClasses([]);
      return;
    }
    const result = await SchoolClassController.getSchoolClasses({
      campus_id: selectedCampusId,
      limit: 100,
      status: "active",
    });
    if (result.success) setSchoolClasses(result.schoolClasses);
    else setSchoolClasses([]);
  }, []);

  useEffect(() => {
    void loadCampuses();
  }, [loadCampuses]);

  useEffect(() => {
    void loadClasses(campusId);
  }, [campusId, loadClasses]);

  useEffect(() => {
    if (
      schoolClassId &&
      !schoolClasses.some((item) => item.id === schoolClassId)
    ) {
      setSchoolClassId("");
    }
  }, [schoolClassId, schoolClasses]);

  const classOptions = useMemo(
    () =>
      schoolClasses.map((schoolClass) => ({
        value: schoolClass.id,
        label: `L${schoolClass.level} · ${schoolClass.name}`,
      })),
    [schoolClasses],
  );

  const updateTeacher = <K extends keyof IIdentityState>(
    field: K,
    value: IIdentityState[K],
  ) => {
    setTeacher((current) => ({ ...current, [field]: value }));
  };

  const validateIdentity = (
    values: IIdentityState,
  ): Partial<IIdentityState> => {
    const errors: Partial<IIdentityState> = {};
    if (!values.username.trim()) {
      errors.username = t(AppLocales.Admin.Teachers.Form.UsernameError);
    }
    if (!values.name.trim()) {
      errors.name = t(AppLocales.Admin.Teachers.Form.NameError);
    }
    if (!values.email.trim()) {
      errors.email = t(AppLocales.Admin.Teachers.Form.EmailError);
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTeacherErrors = validateIdentity(teacher);
    setTeacherErrors(nextTeacherErrors);

    const nextCampusError = campusId
      ? ""
      : t(AppLocales.Admin.Teachers.Form.CampusError);
    setCampusError(nextCampusError);

    if (Object.keys(nextTeacherErrors).length > 0 || nextCampusError) return;

    await onSubmit({
      teacher: {
        username: teacher.username.trim(),
        name: teacher.name.trim(),
        email: teacher.email.trim(),
      },
      campus_id: campusId,
      school_class_id: schoolClassId || undefined,
    });
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <section className="space-y-4">
        <h2 className="text-body-m font-semibold text-base-content">
          {t(AppLocales.Admin.Teachers.Form.TeacherSection)}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label={t(AppLocales.Admin.Teachers.Form.UsernameLabel)}
            value={teacher.username}
            required
            error={teacherErrors.username}
            onChange={(event) => updateTeacher("username", event.target.value)}
          />
          <TextInput
            label={t(AppLocales.Admin.Teachers.Form.NameLabel)}
            value={teacher.name}
            required
            error={teacherErrors.name}
            onChange={(event) => updateTeacher("name", event.target.value)}
          />
          <div className="md:col-span-2">
            <TextInput
              label={t(AppLocales.Admin.Teachers.Form.EmailLabel)}
              type="email"
              value={teacher.email}
              required
              error={teacherErrors.email}
              onChange={(event) => updateTeacher("email", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-300 pt-6">
        <h2 className="text-body-m font-semibold text-base-content">
          {t(AppLocales.Admin.Teachers.Form.PlacementSection)}
        </h2>
        <p className="text-caption text-base-content/60">
          {t(AppLocales.Admin.Teachers.Form.PlacementHint)}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Dropdown
            label={t(AppLocales.Admin.Teachers.Form.CampusLabel)}
            value={campusId}
            onValueChange={(value) => {
              setCampusId(value);
              setSchoolClassId("");
            }}
            placeholder={t(AppLocales.Admin.Teachers.Form.CampusPlaceholder)}
            options={campuses.map((campus) => ({
              value: campus.id,
              label: campus.code
                ? `${campus.name} (${campus.code})`
                : campus.name,
            }))}
            error={campusError || undefined}
          />
          <Dropdown
            label={t(AppLocales.Admin.Teachers.Form.ClassLabel)}
            value={schoolClassId}
            onValueChange={setSchoolClassId}
            placeholder={t(AppLocales.Admin.Teachers.Form.ClassPlaceholder)}
            options={classOptions}
          />
        </div>
      </section>

      <FormActionRow
        submitLabel={t(AppLocales.Admin.Teachers.Form.Submit)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        onCancel={onCancel}
      />
    </FormContainer>
  );
};
