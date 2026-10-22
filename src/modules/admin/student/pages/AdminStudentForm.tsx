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
import { AdminCampusUserSearch } from "../../campus/pages/AdminCampusUserSearch";
import {
  ADMIN_CAMPUS_LEVELS,
} from "../../campus/constants";
import type { IAdminCampus, IAdminSchoolClass } from "../../campus/types";
import type { IAdminUser } from "../../user/types";
import {
  PARENT_MODES,
  type IAdminStudentCreateFormValues,
  type TParentMode,
} from "../types";

interface IAdminStudentFormProps {
  onSubmit: (values: IAdminStudentCreateFormValues) => Promise<void>;
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

export const AdminStudentForm: React.FC<IAdminStudentFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const [searchParams] = useSearchParams();

  const [student, setStudent] = useState<IIdentityState>(emptyIdentity);
  const [parent, setParent] = useState<IIdentityState>(emptyIdentity);
  const [parentMode, setParentMode] = useState<TParentMode>(PARENT_MODES.NONE);
  const [linkedParent, setLinkedParent] = useState<IAdminUser | null>(null);

  const [campuses, setCampuses] = useState<IAdminCampus[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<IAdminSchoolClass[]>([]);
  const [campusId, setCampusId] = useState(searchParams.get("campus_id") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [schoolClassId, setSchoolClassId] = useState(
    searchParams.get("school_class_id") || "",
  );

  const [studentErrors, setStudentErrors] = useState<Partial<IIdentityState>>(
    {},
  );
  const [parentErrors, setParentErrors] = useState<Partial<IIdentityState>>({});
  const [placementError, setPlacementError] = useState("");

  const loadCampuses = useCallback(async () => {
    const result = await CampusController.getCampuses({
      limit: 100,
      status: "active",
    });
    if (result.success) {
      setCampuses(result.campuses);
    }
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
    if (result.success) {
      setSchoolClasses(result.schoolClasses);
    } else {
      setSchoolClasses([]);
    }
  }, []);

  useEffect(() => {
    void loadCampuses();
  }, [loadCampuses]);

  useEffect(() => {
    void loadClasses(campusId);
  }, [campusId, loadClasses]);

  const classesForLevel = useMemo(() => {
    if (!level) return schoolClasses;
    return schoolClasses.filter((item) => String(item.level) === level);
  }, [level, schoolClasses]);

  useEffect(() => {
    if (
      schoolClassId &&
      !classesForLevel.some((item) => item.id === schoolClassId)
    ) {
      setSchoolClassId("");
    }
  }, [classesForLevel, schoolClassId]);

  const updateStudent = <K extends keyof IIdentityState>(
    field: K,
    value: IIdentityState[K],
  ) => {
    setStudent((current) => ({ ...current, [field]: value }));
  };

  const updateParent = <K extends keyof IIdentityState>(
    field: K,
    value: IIdentityState[K],
  ) => {
    setParent((current) => ({ ...current, [field]: value }));
  };

  const validateIdentity = (
    values: IIdentityState,
  ): Partial<IIdentityState> => {
    const errors: Partial<IIdentityState> = {};
    if (!values.username.trim()) {
      errors.username = t(AppLocales.Admin.Students.Form.UsernameError);
    }
    if (!values.name.trim()) {
      errors.name = t(AppLocales.Admin.Students.Form.NameError);
    }
    if (!values.email.trim()) {
      errors.email = t(AppLocales.Admin.Students.Form.EmailError);
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextStudentErrors = validateIdentity(student);
    setStudentErrors(nextStudentErrors);

    let nextParentErrors: Partial<IIdentityState> = {};
    if (parentMode === PARENT_MODES.CREATE) {
      nextParentErrors = validateIdentity(parent);
      setParentErrors(nextParentErrors);
    } else {
      setParentErrors({});
    }

    let nextPlacementError = "";
    if (!campusId || !level || !schoolClassId) {
      nextPlacementError = t(AppLocales.Admin.Students.Form.PlacementError);
    }
    setPlacementError(nextPlacementError);

    if (
      Object.keys(nextStudentErrors).length > 0 ||
      Object.keys(nextParentErrors).length > 0 ||
      nextPlacementError ||
      (parentMode === PARENT_MODES.LINK && !linkedParent)
    ) {
      if (parentMode === PARENT_MODES.LINK && !linkedParent) {
        setPlacementError(t(AppLocales.Admin.Students.Errors.ParentRequired));
      }
      return;
    }

    await onSubmit({
      student: {
        username: student.username.trim(),
        name: student.name.trim(),
        email: student.email.trim(),
      },
      campus_id: campusId,
      level: Number(level),
      school_class_id: schoolClassId,
      parent_mode: parentMode,
      parent:
        parentMode === PARENT_MODES.CREATE
          ? {
              username: parent.username.trim(),
              name: parent.name.trim(),
              email: parent.email.trim(),
            }
          : undefined,
      parent_user_id:
        parentMode === PARENT_MODES.LINK ? linkedParent?.id : undefined,
    });
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <section className="space-y-4">
        <h2 className="text-body-m font-semibold text-base-content">
          {t(AppLocales.Admin.Students.Form.StudentSection)}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label={t(AppLocales.Admin.Students.Form.UsernameLabel)}
            value={student.username}
            required
            error={studentErrors.username}
            onChange={(event) => updateStudent("username", event.target.value)}
          />
          <TextInput
            label={t(AppLocales.Admin.Students.Form.NameLabel)}
            value={student.name}
            required
            error={studentErrors.name}
            onChange={(event) => updateStudent("name", event.target.value)}
          />
          <div className="md:col-span-2">
            <TextInput
              label={t(AppLocales.Admin.Students.Form.EmailLabel)}
              type="email"
              value={student.email}
              required
              error={studentErrors.email}
              onChange={(event) => updateStudent("email", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-300 pt-6">
        <h2 className="text-body-m font-semibold text-base-content">
          {t(AppLocales.Admin.Students.Form.PlacementSection)}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Dropdown
            label={t(AppLocales.Admin.Students.Form.CampusLabel)}
            value={campusId}
            onValueChange={(value) => {
              setCampusId(value);
              setSchoolClassId("");
            }}
            placeholder={t(AppLocales.Admin.Students.Form.CampusPlaceholder)}
            options={campuses.map((campus) => ({
              value: campus.id,
              label: campus.code
                ? `${campus.name} (${campus.code})`
                : campus.name,
            }))}
            error={placementError && !campusId ? placementError : undefined}
          />
          <Dropdown
            label={t(AppLocales.Admin.Students.Form.LevelLabel)}
            value={level}
            onValueChange={(value) => {
              setLevel(value);
              setSchoolClassId("");
            }}
            placeholder={t(AppLocales.Admin.Students.Form.LevelPlaceholder)}
            options={ADMIN_CAMPUS_LEVELS.map((item) => ({
              value: String(item),
              label: t(AppLocales.Admin.Campuses.ClassForm.LevelOption, {
                level: item,
              }),
            }))}
            error={placementError && !level ? placementError : undefined}
          />
          <Dropdown
            label={t(AppLocales.Admin.Students.Form.ClassLabel)}
            value={schoolClassId}
            onValueChange={setSchoolClassId}
            placeholder={t(AppLocales.Admin.Students.Form.ClassPlaceholder)}
            options={classesForLevel.map((schoolClass) => ({
              value: schoolClass.id,
              label: `L${schoolClass.level} · ${schoolClass.name}`,
            }))}
            error={
              placementError && !schoolClassId ? placementError : undefined
            }
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-base-300 pt-6">
        <h2 className="text-body-m font-semibold text-base-content">
          {t(AppLocales.Admin.Students.Form.ParentSection)}
        </h2>
        <p className="text-caption text-base-content/60">
          {t(AppLocales.Admin.Students.Form.ParentHint)}
        </p>
        <Dropdown
          label={t(AppLocales.Admin.Students.Form.ParentModeLabel)}
          value={parentMode}
          onValueChange={(value) => {
            setParentMode(value as TParentMode);
            setLinkedParent(null);
          }}
          options={[
            {
              value: PARENT_MODES.NONE,
              label: t(AppLocales.Admin.Students.Form.ParentModeNone),
            },
            {
              value: PARENT_MODES.CREATE,
              label: t(AppLocales.Admin.Students.Form.ParentModeCreate),
            },
            {
              value: PARENT_MODES.LINK,
              label: t(AppLocales.Admin.Students.Form.ParentModeLink),
            },
          ]}
        />

        {parentMode === PARENT_MODES.CREATE ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label={t(AppLocales.Admin.Students.Form.UsernameLabel)}
              value={parent.username}
              required
              error={parentErrors.username}
              onChange={(event) => updateParent("username", event.target.value)}
            />
            <TextInput
              label={t(AppLocales.Admin.Students.Form.NameLabel)}
              value={parent.name}
              required
              error={parentErrors.name}
              onChange={(event) => updateParent("name", event.target.value)}
            />
            <div className="md:col-span-2">
              <TextInput
                label={t(AppLocales.Admin.Students.Form.EmailLabel)}
                type="email"
                value={parent.email}
                required
                error={parentErrors.email}
                onChange={(event) => updateParent("email", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {parentMode === PARENT_MODES.LINK ? (
          <AdminCampusUserSearch
            label={t(AppLocales.Admin.Students.Form.ParentSearchLabel)}
            selectedUser={linkedParent}
            onSelect={setLinkedParent}
            placeholder={t(AppLocales.Admin.Students.Form.ParentSearchPlaceholder)}
          />
        ) : null}
      </section>

      <FormActionRow
        submitLabel={t(AppLocales.Admin.Students.Form.Submit)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        onCancel={onCancel}
      />
    </FormContainer>
  );
};
