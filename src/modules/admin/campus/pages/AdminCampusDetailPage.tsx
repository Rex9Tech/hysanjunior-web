import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DateTime,
  DateTimeFormats,
  DetailField,
  DetailGrid,
  DetailHeader,
  DetailSection,
  Image,
  StatusBadge,
} from "../../../../design";

import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle, usePermissions } from "../../../../hooks";
import type { IApiPagination } from "../../../../models";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  AdminPagination,
  AdminState,
  AdminTable,
  AlertDialog,
  ConfirmDialog,
  Tabs,
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_ACTIONS,
  ADMIN_PAGE_SIZE,
  ADMIN_RESOURCES,
} from "../../constants";
import { useAdminDetail } from "../../hooks/useAdminDetail";
import type { IAdminUser } from "../../user/types";
import CampusController from "../campus.controller";
import CampusMembershipController from "../campus_membership.controller";
import SchoolClassController from "../school_class.controller";
import { unwrapNested } from "../campus.helpers";
import {
  ADMIN_CAMPUS_DETAIL_TABS,
  ADMIN_CAMPUS_LEVELS,
  ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS,
  ADMIN_CLASS_ENROLLMENT_TABLE_KEYS,
  ADMIN_SCHOOL_CLASS_TABLE_KEYS,
} from "../constants";
import type {
  IAdminCampus,
  IAdminCampusMembership,
  IAdminClassEnrollment,
  IAdminSchoolClass,
  IAdminSchoolClassFormValues,
  TCampusDetailTab,
} from "../types";
import { AdminCampusUserSearch } from "./AdminCampusUserSearch";
import { AdminSchoolClassForm } from "./AdminSchoolClassForm";

const loadCampus = async (id: string) => {
  const result = await CampusController.getCampus(id);
  return { ...result, record: result.campus };
};

export const AdminCampusDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const { record: campus, error, reload } = useAdminDetail<IAdminCampus>(
    id,
    loadCampus,
  );

  const tabParam = searchParams.get("tab") as TCampusDetailTab | null;
  const activeTab: TCampusDetailTab =
    tabParam &&
    Object.values(ADMIN_CAMPUS_DETAIL_TABS).includes(tabParam)
      ? tabParam
      : ADMIN_CAMPUS_DETAIL_TABS.OVERVIEW;

  useDocumentTitle(
    `${campus?.name || t(AppLocales.Admin.Campuses.Detail.Title)} | Admin`,
  );

  const listPath = AppRoutes.client.protected.admin.CAMPUSES;
  const canUpdate = can(ADMIN_ACTIONS.UPDATE, ADMIN_RESOURCES.CAMPUSES);
  const canManageClasses = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.SCHOOL_CLASSES,
  );
  const canManageTeachers = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.CAMPUS_MEMBERSHIPS,
  );
  const canCreateStudents = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.CLASS_ENROLLMENTS,
  );

  const teacherCreatePath = id
    ? `${AppRoutes.client.protected.admin.TEACHER_CREATE}?campus_id=${encodeURIComponent(id)}`
    : AppRoutes.client.protected.admin.TEACHER_CREATE;
  const studentCreatePath = id
    ? `${AppRoutes.client.protected.admin.STUDENT_CREATE}?campus_id=${encodeURIComponent(id)}`
    : AppRoutes.client.protected.admin.STUDENT_CREATE;

  const [classes, setClasses] = useState<IAdminSchoolClass[]>([]);
  const [classPagination, setClassPagination] =
    useState<IApiPagination | null>(null);
  const [classPage, setClassPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState("");
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<IAdminSchoolClass | null>(
    null,
  );
  const [discardClassTarget, setDiscardClassTarget] =
    useState<IAdminSchoolClass | null>(null);

  const [memberships, setMemberships] = useState<IAdminCampusMembership[]>([]);
  const [membershipPagination, setMembershipPagination] =
    useState<IApiPagination | null>(null);
  const [membershipPage, setMembershipPage] = useState(1);
  const [teacherToAdd, setTeacherToAdd] = useState<IAdminUser | null>(null);
  const [discardMembershipTarget, setDiscardMembershipTarget] =
    useState<IAdminCampusMembership | null>(null);

  const [enrollments, setEnrollments] = useState<IAdminClassEnrollment[]>([]);
  const [enrollmentPagination, setEnrollmentPagination] =
    useState<IApiPagination | null>(null);
  const [studentPage, setStudentPage] = useState(1);
  const [studentLevelFilter, setStudentLevelFilter] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("");
  const [studentsCount, setStudentsCount] = useState(0);

  const [alertMessage, setAlertMessage] = useState("");

  const setTab = (tab: TCampusDetailTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === ADMIN_CAMPUS_DETAIL_TABS.OVERVIEW) next.delete("tab");
        else next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  };

  const loadClasses = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await SchoolClassController.getSchoolClasses({
      campus_id: id,
      page: classPage,
      limit: ADMIN_PAGE_SIZE,
      level: levelFilter || undefined,
    });
    setLoading(false);
    if (result.success) {
      setClasses(result.schoolClasses);
      setClassPagination(result.pagination);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadClasses),
      );
    }
  }, [classPage, id, levelFilter, setLoading, t]);

  const loadMemberships = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await CampusMembershipController.getMemberships({
      campus_id: id,
      page: membershipPage,
      limit: ADMIN_PAGE_SIZE,
    });
    setLoading(false);
    if (result.success) {
      setMemberships(result.memberships);
      setMembershipPagination(result.pagination);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadTeachers),
      );
    }
  }, [id, membershipPage, setLoading, t]);

  const loadStudentsCount = useCallback(async () => {
    if (!id) return;
    const result = await CampusController.getCampusStudents(id, {
      page: 1,
      limit: 1,
    });
    if (result.success) {
      setStudentsCount(result.pagination?.total_count ?? 0);
    }
  }, [id]);

  const loadStudents = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await CampusController.getCampusStudents(id, {
      page: studentPage,
      limit: ADMIN_PAGE_SIZE,
      level: studentLevelFilter || undefined,
      school_class_id: studentClassFilter || undefined,
    });
    setLoading(false);
    if (result.success) {
      setEnrollments(result.enrollments);
      setEnrollmentPagination(result.pagination);
      if (!studentLevelFilter && !studentClassFilter) {
        setStudentsCount(result.pagination?.total_count ?? 0);
      }
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadStudents),
      );
    }
  }, [
    id,
    setLoading,
    studentClassFilter,
    studentLevelFilter,
    studentPage,
    t,
  ]);

  useEffect(() => {
    if (!campus) return;
    void loadStudentsCount();
  }, [campus, loadStudentsCount]);

  useEffect(() => {
    if (!campus) return;
    if (activeTab === ADMIN_CAMPUS_DETAIL_TABS.CLASSES) void loadClasses();
    if (activeTab === ADMIN_CAMPUS_DETAIL_TABS.TEACHERS) void loadMemberships();
    if (activeTab === ADMIN_CAMPUS_DETAIL_TABS.STUDENTS) {
      void loadClasses();
      void loadStudents();
    }
  }, [activeTab, campus, loadClasses, loadMemberships, loadStudents]);

  const classColumns = useMemo<IAdminTableColumn<IAdminSchoolClass>[]>(
    () => [
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.NAME,
        header: t(AppLocales.Admin.Campuses.Classes.Table.Name),
        render: (row) => (
          <span className="font-semibold text-base-content">{row.name}</span>
        ),
      },
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.LEVEL,
        header: t(AppLocales.Admin.Campuses.Classes.Table.Level),
        className: "text-center",
        render: (row) => row.level,
      },
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.STATUS,
        header: t(AppLocales.Admin.Campuses.Classes.Table.Status),
        className: "text-center",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.STUDENTS,
        header: t(AppLocales.Admin.Campuses.Classes.Table.Students),
        className: "text-center",
        render: (row) => row.students_count ?? 0,
      },
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.TEACHERS,
        header: t(AppLocales.Admin.Campuses.Classes.Table.Teachers),
        className: "text-center",
        render: (row) => row.teachers_count ?? 0,
      },
      {
        key: ADMIN_SCHOOL_CLASS_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.FLAT}
              onClick={(e) => {
                e.stopPropagation();
                setEditingClass(row);
                setClassFormOpen(true);
              }}
            >
              {t(AppLocales.Admin.Common.Actions.Edit)}
            </Button>
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.FLAT}
              onClick={(e) => {
                e.stopPropagation();
                setDiscardClassTarget(row);
              }}
            >
              {t(AppLocales.Admin.Common.Actions.Discard)}
            </Button>
          </div>
        ),
      },
    ],
    [t],
  );

  const teacherColumns = useMemo<
    IAdminTableColumn<IAdminCampusMembership>[]
  >(
    () => [
      {
        key: ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS.USER,
        header: t(AppLocales.Admin.Campuses.Teachers.Table.Teacher),
        render: (row) => (
          <div>
            <div className="font-semibold">
              {row.user?.name || row.user?.username || row.user_id}
            </div>
            <div className="text-caption text-base-content/60 text-xs">
              {row.user?.email}
            </div>
          </div>
        ),
      },
      {
        key: ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS.KIND,
        header: t(AppLocales.Admin.Campuses.Teachers.Table.Kind),
        render: (row) => row.kind,
      },
      {
        key: ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS.CREATED,
        header: t(AppLocales.Admin.Common.Table.CreatedAt),
        render: (row) => (
          <DateTime value={row.created_at} format={DateTimeFormats.ADMIN} />
        ),
      },
      {
        key: ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (row) => (
          <Button
            size={ButtonSizes.SM}
            variant={ButtonVariants.FLAT}
            onClick={() => setDiscardMembershipTarget(row)}
          >
            {t(AppLocales.Admin.Campuses.Teachers.Remove)}
          </Button>
        ),
      },
    ],
    [t],
  );

  const studentColumns = useMemo<
    IAdminTableColumn<IAdminClassEnrollment>[]
  >(
    () => [
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.STUDENT,
        header: t(AppLocales.Admin.Campuses.Students.Table.Student),
        render: (row) => (
          <div>
            <div className="font-semibold">
              {row.student?.name || row.student?.username || row.user_id}
            </div>
            <div className="text-caption text-base-content/60 text-xs">
              {row.student?.email}
            </div>
          </div>
        ),
      },
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.CLASS,
        header: t(AppLocales.Admin.Campuses.Students.Table.Class),
        render: (row) => {
          const schoolClass = unwrapNested(row.school_class);
          return schoolClass?.name || "—";
        },
      },
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.LEVEL,
        header: t(AppLocales.Admin.Campuses.Students.Table.Level),
        className: "text-center",
        render: (row) => unwrapNested(row.school_class)?.level ?? "—",
      },
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.PARENTS,
        header: t(AppLocales.Admin.Campuses.Students.Table.Parents),
        render: (row) =>
          row.parents?.length
            ? row.parents.map((p) => p.name || p.username).join(", ")
            : "—",
      },
    ],
    [t],
  );

  const handleSaveClass = async (values: IAdminSchoolClassFormValues) => {
    setLoading(true, { overlay: false });
    const result = editingClass
      ? await SchoolClassController.updateSchoolClass(editingClass.id, values)
      : await SchoolClassController.createSchoolClass(values);
    setLoading(false, { overlay: false });

    if (result.success) {
      toast.success(
        result.message ||
          (editingClass
            ? t(AppLocales.Admin.Campuses.Toasts.UpdateClassSuccess)
            : t(AppLocales.Admin.Campuses.Toasts.CreateClassSuccess)),
      );
      setClassFormOpen(false);
      setEditingClass(null);
      void loadClasses();
      reload();
    } else {
      setAlertMessage(
        result.error ||
          (editingClass
            ? t(AppLocales.Admin.Campuses.Errors.UpdateClass)
            : t(AppLocales.Admin.Campuses.Errors.CreateClass)),
      );
    }
  };

  const handleDiscardClass = async () => {
    if (!discardClassTarget) return;
    setLoading(true);
    const result = await SchoolClassController.discardSchoolClass(
      discardClassTarget.id,
    );
    setLoading(false);
    if (result.success) {
      toast.success(
        result.message || t(AppLocales.Admin.Campuses.Toasts.DeleteClassSuccess),
      );
      setDiscardClassTarget(null);
      void loadClasses();
      reload();
    } else {
      toast.error(
        result.error || t(AppLocales.Admin.Campuses.Errors.DeleteClass),
      );
    }
  };

  const handleAddTeacher = async () => {
    if (!id || !teacherToAdd) return;
    setLoading(true, { overlay: false });
    const result = await CampusMembershipController.createMembership({
      campus_id: id,
      user_id: teacherToAdd.id,
    });
    setLoading(false, { overlay: false });
    if (result.success) {
      toast.success(
        result.message || t(AppLocales.Admin.Campuses.Toasts.AddTeacherSuccess),
      );
      setTeacherToAdd(null);
      void loadMemberships();
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.AddTeacher),
      );
    }
  };

  const handleDiscardMembership = async () => {
    if (!discardMembershipTarget) return;
    setLoading(true);
    const result = await CampusMembershipController.discardMembership(
      discardMembershipTarget.id,
    );
    setLoading(false);
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.RemoveTeacherSuccess),
      );
      setDiscardMembershipTarget(null);
      void loadMemberships();
      reload();
    } else {
      toast.error(
        result.error || t(AppLocales.Admin.Campuses.Errors.RemoveTeacher),
      );
    }
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        breadcrumbs={[
          {
            label: t(AppLocales.Admin.Common.Detail.Admin),
            to: AppRoutes.client.protected.admin.HOME,
          },
          { label: t(AppLocales.Admin.Campuses.Title), to: listPath },
          { label: campus?.name || t(AppLocales.Admin.Common.Detail.Details) },
        ]}
        title={campus?.name || t(AppLocales.Admin.Campuses.Detail.Title)}
        description={t(AppLocales.Admin.Campuses.Detail.Description)}
        backTo={listPath}
        icon={iconsLib.home}
        statusBadge={
          campus ? <StatusBadge status={campus.status} /> : undefined
        }
        entityId={campus?.id}
        timestamps={
          campus
            ? { createdAt: campus.created_at, updatedAt: campus.updated_at }
            : undefined
        }
        action={
          campus && canUpdate ? (
            <Button
              variant={ButtonVariants.SECONDARY}
              size={ButtonSizes.SM}
              onClick={() =>
                navigate(
                  AppRoutes.withId(
                    AppRoutes.client.protected.admin.CAMPUS_EDIT,
                    campus.id,
                  ),
                )
              }
            >
              {t(AppLocales.Admin.Common.Actions.Edit)}
            </Button>
          ) : null
        }
      />

      {error ? (
        <AdminState
          title={t(AppLocales.Admin.Campuses.Errors.LoadOne)}
          message={error}
        />
      ) : campus ? (
        <>
          <Tabs
            value={activeTab}
            onChange={(tab) => setTab(tab as TCampusDetailTab)}
            items={[
              {
                value: ADMIN_CAMPUS_DETAIL_TABS.OVERVIEW,
                label: t(AppLocales.Admin.Campuses.Detail.Tabs.Overview),
                icon: iconsLib.info,
              },
              {
                value: ADMIN_CAMPUS_DETAIL_TABS.CLASSES,
                label: t(AppLocales.Admin.Campuses.Detail.Tabs.Classes),
                icon: iconsLib.document,
                count: campus.school_classes_count,
              },
              {
                value: ADMIN_CAMPUS_DETAIL_TABS.TEACHERS,
                label: t(AppLocales.Admin.Campuses.Detail.Tabs.Teachers),
                icon: iconsLib.userGroup,
                count: campus.teachers_count,
              },
              {
                value: ADMIN_CAMPUS_DETAIL_TABS.STUDENTS,
                label: t(AppLocales.Admin.Campuses.Detail.Tabs.Students),
                icon: iconsLib.user,
                count: studentsCount,
              },
            ]}
          />

          {activeTab === ADMIN_CAMPUS_DETAIL_TABS.OVERVIEW ? (
            <DetailSection
              title={t(AppLocales.Admin.Campuses.Detail.Overview)}
              icon={iconsLib.home}
              accent
            >
              <DetailGrid>
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Image)}
                  value={
                    unwrapNested(campus.image)?.url ? (
                      <div className="h-24 w-36 overflow-hidden rounded-lg border border-base-300 bg-base-200">
                        <Image
                          src={unwrapNested(campus.image)?.url || ""}
                          alt={campus.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Name)}
                  value={campus.name}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Phone)}
                  value={campus.phone || "—"}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Location)}
                  value={campus.location || "—"}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Status)}
                  value={<StatusBadge status={campus.status} />}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Classes)}
                  value={String(campus.school_classes_count ?? 0)}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Teachers)}
                  value={String(campus.teachers_count ?? 0)}
                />
                <DetailField
                  label={t(AppLocales.Admin.Campuses.Table.Students)}
                  value={String(studentsCount)}
                />
              </DetailGrid>
            </DetailSection>
          ) : null}

          {activeTab === ADMIN_CAMPUS_DETAIL_TABS.CLASSES ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <select
                  className="select select-bordered select-sm w-full sm:w-48"
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                    setClassPage(1);
                  }}
                >
                  <option value="">
                    {t(AppLocales.Admin.Campuses.Classes.AllLevels)}
                  </option>
                  {ADMIN_CAMPUS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {t(AppLocales.Admin.Campuses.ClassForm.LevelOption, {
                        level,
                      })}
                    </option>
                  ))}
                </select>
                {canManageClasses ? (
                  <Button
                    size={ButtonSizes.SM}
                    onClick={() => {
                      setEditingClass(null);
                      setClassFormOpen(true);
                    }}
                  >
                    <iconsLib.plus className="mr-2 h-4 w-4" />
                    {t(AppLocales.Admin.Campuses.Classes.Add)}
                  </Button>
                ) : null}
              </div>

              {classFormOpen ? (
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <AdminSchoolClassForm
                    mode={
                      editingClass ? ADMIN_ACTIONS.EDIT : ADMIN_ACTIONS.CREATE
                    }
                    campusId={campus.id}
                    schoolClass={editingClass}
                    onSubmit={handleSaveClass}
                    onCancel={() => {
                      setClassFormOpen(false);
                      setEditingClass(null);
                    }}
                  />
                </div>
              ) : null}

              {!isLoading && classes.length === 0 ? (
                <AdminState
                  icon={iconsLib.document}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.Classes.Empty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={classColumns}
                    records={classes}
                    getRowKey={(row) => row.id}
                    onRowClick={(row) =>
                      navigate(
                        AppRoutes.withId(
                          AppRoutes.client.protected.admin.SCHOOL_CLASS_DETAIL,
                          row.id,
                        ),
                      )
                    }
                  />
                  <AdminPagination
                    pagination={classPagination}
                    onPageChange={setClassPage}
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === ADMIN_CAMPUS_DETAIL_TABS.TEACHERS ? (
            <div className="space-y-4">
              {canManageTeachers ? (
                <div className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-caption text-base-content/60">
                      {t(AppLocales.Admin.Campuses.Teachers.RoleHint)}
                    </p>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.SECONDARY}
                      onClick={() => navigate(teacherCreatePath)}
                    >
                      <iconsLib.plus className="mr-2 h-4 w-4" />
                      {t(AppLocales.Admin.Campuses.Teachers.Create)}
                    </Button>
                  </div>
                  <AdminCampusUserSearch
                    label={t(AppLocales.Admin.Campuses.Teachers.AddLabel)}
                    selectedUser={teacherToAdd}
                    onSelect={setTeacherToAdd}
                  />
                  <Button
                    size={ButtonSizes.SM}
                    disabled={!teacherToAdd}
                    onClick={() => void handleAddTeacher()}
                  >
                    {t(AppLocales.Admin.Campuses.Teachers.Add)}
                  </Button>
                </div>
              ) : null}

              {!isLoading && memberships.length === 0 ? (
                <AdminState
                  icon={iconsLib.userGroup}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.Teachers.Empty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={teacherColumns}
                    records={memberships}
                    getRowKey={(row) => row.id}
                  />
                  <AdminPagination
                    pagination={membershipPagination}
                    onPageChange={setMembershipPage}
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === ADMIN_CAMPUS_DETAIL_TABS.STUDENTS ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    className="select select-bordered select-sm w-full sm:w-48"
                    value={studentLevelFilter}
                    onChange={(e) => {
                      setStudentLevelFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">
                      {t(AppLocales.Admin.Campuses.Classes.AllLevels)}
                    </option>
                    {ADMIN_CAMPUS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {t(AppLocales.Admin.Campuses.ClassForm.LevelOption, {
                          level,
                        })}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select select-bordered select-sm w-full sm:w-56"
                    value={studentClassFilter}
                    onChange={(e) => {
                      setStudentClassFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">
                      {t(AppLocales.Admin.Campuses.Students.AllClasses)}
                    </option>
                    {classes.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        L{schoolClass.level} · {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </div>
                {canCreateStudents ? (
                  <Button
                    size={ButtonSizes.SM}
                    onClick={() => navigate(studentCreatePath)}
                  >
                    <iconsLib.plus className="mr-2 h-4 w-4" />
                    {t(AppLocales.Admin.Campuses.Students.Create)}
                  </Button>
                ) : null}
              </div>

              {!isLoading && enrollments.length === 0 ? (
                <AdminState
                  icon={iconsLib.user}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.Students.Empty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={studentColumns}
                    records={enrollments}
                    getRowKey={(row) => row.id}
                    onRowClick={(row) =>
                      navigate(
                        AppRoutes.withId(
                          AppRoutes.client.protected.admin.SCHOOL_CLASS_DETAIL,
                          row.school_class_id,
                        ),
                      )
                    }
                  />
                  <AdminPagination
                    pagination={enrollmentPagination}
                    onPageChange={setStudentPage}
                  />
                </>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <ConfirmDialog
        isOpen={Boolean(discardClassTarget)}
        title={t(AppLocales.Admin.Campuses.Confirm.DeleteClassTitle)}
        message={t(AppLocales.Admin.Campuses.Confirm.DeleteClassMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Discard)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setDiscardClassTarget(null)}
        onConfirm={handleDiscardClass}
      />
      <ConfirmDialog
        isOpen={Boolean(discardMembershipTarget)}
        title={t(AppLocales.Admin.Campuses.Confirm.RemoveTeacherTitle)}
        message={t(AppLocales.Admin.Campuses.Confirm.RemoveTeacherMessage)}
        confirmLabel={t(AppLocales.Admin.Campuses.Teachers.Remove)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setDiscardMembershipTarget(null)}
        onConfirm={handleDiscardMembership}
      />
    </div>
  );
};
