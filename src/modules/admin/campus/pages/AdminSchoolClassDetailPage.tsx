import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_ACTIONS,
  ADMIN_PAGE_SIZE,
  ADMIN_RESOURCES,
} from "../../constants";
import { useAdminDetail } from "../../hooks/useAdminDetail";
import type { IAdminUser } from "../../user/types";
import { unwrapNested } from "../campus.helpers";
import CampusMembershipController from "../campus_membership.controller";
import ClassAssignmentController from "../class_assignment.controller";
import ClassEnrollmentController from "../class_enrollment.controller";
import ClassHomeworkController from "../class_homework.controller";
import SchoolClassController from "../school_class.controller";
import {
  ADMIN_CLASS_ASSIGNMENT_TABLE_KEYS,
  ADMIN_CLASS_ENROLLMENT_TABLE_KEYS,
  ADMIN_CLASS_HOMEWORK_TABLE_KEYS,
} from "../constants";
import type {
  IAdminCampusMembership,
  IAdminClassAssignment,
  IAdminClassEnrollment,
  IAdminClassHomework,
  IAdminClassHomeworkFormValues,
  IAdminSchoolClass,
} from "../types";
import { AdminCampusUserSearch } from "./AdminCampusUserSearch";
import { AssignHomeworkDialog } from "./AssignHomeworkDialog";


const loadSchoolClass = async (id: string) => {
  const result = await SchoolClassController.getSchoolClass(id);
  return { ...result, record: result.schoolClass };
};

export const AdminSchoolClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const t = useTranslate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can } = usePermissions();
  const {
    record: schoolClass,
    error,
    reload,
  } = useAdminDetail<IAdminSchoolClass>(id, loadSchoolClass);

  const campus = unwrapNested(schoolClass?.campus);
  const campusDetailPath = campus
    ? `${AppRoutes.withId(
        AppRoutes.client.protected.admin.CAMPUS_DETAIL,
        campus.id,
      )}?tab=classes`
    : AppRoutes.client.protected.admin.CAMPUSES;

  useDocumentTitle(
    `${
      schoolClass
        ? `L${schoolClass.level} · ${schoolClass.name}`
        : t(AppLocales.Admin.Campuses.ClassDetail.Title)
    } | Admin`,
  );

  const canAssign = can(ADMIN_ACTIONS.CREATE, ADMIN_RESOURCES.CLASS_ASSIGNMENTS);
  const canEnroll = can(ADMIN_ACTIONS.CREATE, ADMIN_RESOURCES.CLASS_ENROLLMENTS);
  const canAssignHomework = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.CLASS_HOMEWORKS,
  );
  const canUpdateHomework = can(
    ADMIN_ACTIONS.UPDATE,
    ADMIN_RESOURCES.CLASS_HOMEWORKS,
  );
  const canDiscardHomework = can(
    ADMIN_ACTIONS.DELETE,
    ADMIN_RESOURCES.CLASS_HOMEWORKS,
  );

  const [assignments, setAssignments] = useState<IAdminClassAssignment[]>([]);
  const [assignmentPagination, setAssignmentPagination] =
    useState<IApiPagination | null>(null);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [campusTeachers, setCampusTeachers] = useState<
    IAdminCampusMembership[]
  >([]);
  const [teacherUserId, setTeacherUserId] = useState("");
  const [discardAssignmentTarget, setDiscardAssignmentTarget] =
    useState<IAdminClassAssignment | null>(null);

  const [enrollments, setEnrollments] = useState<IAdminClassEnrollment[]>([]);
  const [enrollmentPagination, setEnrollmentPagination] =
    useState<IApiPagination | null>(null);
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [studentToEnroll, setStudentToEnroll] = useState<IAdminUser | null>(
    null,
  );
  const [discardEnrollmentTarget, setDiscardEnrollmentTarget] =
    useState<IAdminClassEnrollment | null>(null);

  const [homeworks, setHomeworks] = useState<IAdminClassHomework[]>([]);
  const [homeworkPagination, setHomeworkPagination] =
    useState<IApiPagination | null>(null);
  const [homeworkPage, setHomeworkPage] = useState(1);
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] =
    useState<IAdminClassHomework | null>(null);
  const [discardHomeworkTarget, setDiscardHomeworkTarget] =
    useState<IAdminClassHomework | null>(null);
  const [homeworkSubmitting, setHomeworkSubmitting] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");


  const loadAssignments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await ClassAssignmentController.getAssignments({
      school_class_id: id,
      page: assignmentPage,
      limit: ADMIN_PAGE_SIZE,
    });
    setLoading(false);
    if (result.success) {
      setAssignments(result.assignments);
      setAssignmentPagination(result.pagination);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadAssignments),
      );
    }
  }, [assignmentPage, id, setLoading, t]);

  const loadEnrollments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await ClassEnrollmentController.getEnrollments({
      school_class_id: id,
      page: enrollmentPage,
      limit: ADMIN_PAGE_SIZE,
    });
    setLoading(false);
    if (result.success) {
      setEnrollments(result.enrollments);
      setEnrollmentPagination(result.pagination);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadEnrollments),
      );
    }
  }, [enrollmentPage, id, setLoading, t]);

  const loadCampusTeachers = useCallback(async () => {
    if (!schoolClass?.campus_id) return;
    const result = await CampusMembershipController.getMemberships({
      campus_id: schoolClass.campus_id,
      limit: 100,
    });
    if (result.success) {
      setCampusTeachers(result.memberships);
    }
  }, [schoolClass?.campus_id]);

  const loadHomeworks = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await ClassHomeworkController.getHomeworks({
      school_class_id: id,
      page: homeworkPage,
      limit: ADMIN_PAGE_SIZE,
    });
    setLoading(false);
    if (result.success) {
      setHomeworks(result.homeworks);
      setHomeworkPagination(result.pagination);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.LoadHomeworks),
      );
    }
  }, [homeworkPage, id, setLoading, t]);

  useEffect(() => {
    if (!schoolClass) return;
    void loadAssignments();
    void loadEnrollments();
    void loadHomeworks();
    void loadCampusTeachers();
  }, [
    loadAssignments,
    loadCampusTeachers,
    loadEnrollments,
    loadHomeworks,
    schoolClass,
  ]);


  const assignedTeacherIds = useMemo(
    () => new Set(assignments.map((a) => a.user_id)),
    [assignments],
  );

  const availableTeachers = campusTeachers.filter(
    (m) => !assignedTeacherIds.has(m.user_id),
  );

  const assignmentColumns = useMemo<
    IAdminTableColumn<IAdminClassAssignment>[]
  >(
    () => [
      {
        key: ADMIN_CLASS_ASSIGNMENT_TABLE_KEYS.TEACHER,
        header: t(AppLocales.Admin.Campuses.ClassDetail.TeachersTable.Teacher),
        render: (row) => (
          <div>
            <div className="font-semibold">
              {row.teacher?.name || row.teacher?.username || row.user_id}
            </div>
            <div className="text-caption text-base-content/60 text-xs">
              {row.teacher?.email}
            </div>
          </div>
        ),
      },
      {
        key: ADMIN_CLASS_ASSIGNMENT_TABLE_KEYS.CREATED,
        header: t(AppLocales.Admin.Common.Table.CreatedAt),
        render: (row) => (
          <DateTime value={row.created_at} format={DateTimeFormats.ADMIN} />
        ),
      },
      {
        key: ADMIN_CLASS_ASSIGNMENT_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (row) => (
          <Button
            size={ButtonSizes.SM}
            variant={ButtonVariants.TERTIARY}
            onClick={() => setDiscardAssignmentTarget(row)}
          >
            {t(AppLocales.Admin.Campuses.ClassDetail.Unassign)}
          </Button>
        ),
      },
    ],
    [t],
  );

  const enrollmentColumns = useMemo<
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
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.STATUS,
        header: t(AppLocales.Admin.Campuses.Students.Table.Status),
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.PARENTS,
        header: t(AppLocales.Admin.Campuses.Students.Table.Parents),
        render: (row) =>
          row.parents?.length
            ? row.parents.map((p) => p.name || p.username).join(", ")
            : "—",
      },
      {
        key: ADMIN_CLASS_ENROLLMENT_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (row) => (
          <Button
            size={ButtonSizes.SM}
            variant={ButtonVariants.TERTIARY}
            onClick={() => setDiscardEnrollmentTarget(row)}
          >
            {t(AppLocales.Admin.Campuses.ClassDetail.Unenroll)}
          </Button>
        ),
      },
    ],
    [t],
  );

  const handleAssignTeacher = async () => {
    if (!id || !teacherUserId) return;
    setLoading(true, { overlay: false });
    const result = await ClassAssignmentController.createAssignment({
      school_class_id: id,
      user_id: teacherUserId,
    });
    setLoading(false, { overlay: false });
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.AssignTeacherSuccess),
      );
      setTeacherUserId("");
      void loadAssignments();
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.AssignTeacher),
      );
    }
  };

  const handleDiscardAssignment = async () => {
    if (!discardAssignmentTarget) return;
    setLoading(true);
    const result = await ClassAssignmentController.discardAssignment(
      discardAssignmentTarget.id,
    );
    setLoading(false);
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.UnassignTeacherSuccess),
      );
      setDiscardAssignmentTarget(null);
      void loadAssignments();
      reload();
    } else {
      toast.error(
        result.error || t(AppLocales.Admin.Campuses.Errors.UnassignTeacher),
      );
    }
  };

  const handleEnrollStudent = async () => {
    if (!id || !studentToEnroll) return;
    setLoading(true, { overlay: false });
    const result = await ClassEnrollmentController.createEnrollment({
      school_class_id: id,
      user_id: studentToEnroll.id,
    });
    setLoading(false, { overlay: false });
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.EnrollStudentSuccess),
      );
      setStudentToEnroll(null);
      void loadEnrollments();
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.EnrollStudent),
      );
    }
  };

  const handleDiscardEnrollment = async () => {
    if (!discardEnrollmentTarget) return;
    setLoading(true);
    const result = await ClassEnrollmentController.discardEnrollment(
      discardEnrollmentTarget.id,
    );
    setLoading(false);
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.UnenrollStudentSuccess),
      );
      setDiscardEnrollmentTarget(null);
      void loadEnrollments();
      reload();
    } else {
      toast.error(
        result.error || t(AppLocales.Admin.Campuses.Errors.UnenrollStudent),
      );
    }
  };

  const homeworkColumns = useMemo<IAdminTableColumn<IAdminClassHomework>[]>(
    () => [
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.LESSON,
        header: t(AppLocales.Admin.Campuses.ClassDetail.HomeworkTable.Lesson),
        render: (row) => (
          <div>
            <div className="font-semibold">
              {row.title ||
                (row.lesson
                  ? `L${row.lesson.level} · ${row.lesson.title}`
                  : row.lesson_id)}
            </div>
            {row.title && row.lesson ? (
              <div className="text-caption text-base-content/60 text-xs">
                {`L${row.lesson.level} · ${row.lesson.title}`}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.ACTIVITIES,
        header: t(
          AppLocales.Admin.Campuses.ClassDetail.HomeworkTable.Activities,
        ),
        render: (row) =>
          (row.activity_labels || row.activity_keys).join(" → ") || "—",
      },
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.INTROS,
        header: t(AppLocales.Admin.Campuses.ClassDetail.HomeworkTable.Intros),
        render: (row) => {
          const badges = [
            row.play_song_at_first
              ? t(AppLocales.Admin.Campuses.Homework.SongBadge)
              : null,
            row.play_story_at_first
              ? t(AppLocales.Admin.Campuses.Homework.StoryBadge)
              : null,
          ].filter(Boolean);
          return badges.length ? badges.join(", ") : "—";
        },
      },
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.DUE,
        header: t(AppLocales.Admin.Campuses.ClassDetail.HomeworkTable.Due),
        render: (row) => row.due_on || "—",
      },
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-2">
            {canUpdateHomework ? (
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                onClick={() => {
                  setEditingHomework(row);
                  setHomeworkDialogOpen(true);
                }}
              >
                {t(AppLocales.Admin.Campuses.ClassDetail.EditHomework)}
              </Button>
            ) : null}
            {canDiscardHomework ? (
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                onClick={() => setDiscardHomeworkTarget(row)}
              >
                {t(AppLocales.Admin.Campuses.ClassDetail.DiscardHomework)}
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDiscardHomework, canUpdateHomework, t],
  );

  const openCreateHomework = () => {
    setEditingHomework(null);
    setHomeworkDialogOpen(true);
  };

  const handleHomeworkSubmit = async (
    values: IAdminClassHomeworkFormValues,
  ) => {
    setHomeworkSubmitting(true);
    const result = editingHomework
      ? await ClassHomeworkController.updateHomework(editingHomework.id, {
          lesson_id: values.lesson_id,
          activity_keys: values.activity_keys,
          play_song_at_first: values.play_song_at_first,
          play_story_at_first: values.play_story_at_first,
          title: values.title,
          due_on: values.due_on,
        })
      : await ClassHomeworkController.createHomework(values);
    setHomeworkSubmitting(false);

    if (result.success) {
      toast.success(
        result.message ||
          t(
            editingHomework
              ? AppLocales.Admin.Campuses.Toasts.UpdateHomeworkSuccess
              : AppLocales.Admin.Campuses.Toasts.AssignHomeworkSuccess,
          ),
      );
      setHomeworkDialogOpen(false);
      setEditingHomework(null);
      void loadHomeworks();
    } else {
      setAlertMessage(
        result.error ||
          t(
            editingHomework
              ? AppLocales.Admin.Campuses.Errors.UpdateHomework
              : AppLocales.Admin.Campuses.Errors.AssignHomework,
          ),
      );
    }
  };

  const handleDiscardHomework = async () => {
    if (!discardHomeworkTarget) return;
    setLoading(true);
    const result = await ClassHomeworkController.discardHomework(
      discardHomeworkTarget.id,
    );
    setLoading(false);
    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Campuses.Toasts.DiscardHomeworkSuccess),
      );
      setDiscardHomeworkTarget(null);
      void loadHomeworks();
    } else {
      toast.error(
        result.error || t(AppLocales.Admin.Campuses.Errors.DiscardHomework),
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
          {
            label: t(AppLocales.Admin.Campuses.Title),
            to: AppRoutes.client.protected.admin.CAMPUSES,
          },
          {
            label: campus?.name || t(AppLocales.Admin.Campuses.Detail.Title),
            to: campusDetailPath,
          },
          {
            label: schoolClass
              ? `L${schoolClass.level} · ${schoolClass.name}`
              : t(AppLocales.Admin.Campuses.ClassDetail.Title),
          },
        ]}
        title={
          schoolClass
            ? `L${schoolClass.level} · ${schoolClass.name}`
            : t(AppLocales.Admin.Campuses.ClassDetail.Title)
        }
        description={t(AppLocales.Admin.Campuses.ClassDetail.Description)}
        backTo={campusDetailPath}
        icon={iconsLib.document}
        statusBadge={
          schoolClass ? <StatusBadge status={schoolClass.status} /> : undefined
        }
        entityId={schoolClass?.id}
        timestamps={
          schoolClass
            ? {
                createdAt: schoolClass.created_at,
                updatedAt: schoolClass.updated_at,
              }
            : undefined
        }
      />

      {error ? (
        <AdminState
          title={t(AppLocales.Admin.Campuses.Errors.LoadClass)}
          message={error}
        />
      ) : schoolClass ? (
        <div className="space-y-6">
          <DetailSection
            title={t(AppLocales.Admin.Campuses.ClassDetail.Overview)}
            icon={iconsLib.document}
            accent
          >
            <DetailGrid>
              <DetailField
                label={t(AppLocales.Admin.Campuses.Classes.Table.Name)}
                value={schoolClass.name}
              />
              <DetailField
                label={t(AppLocales.Admin.Campuses.Classes.Table.Level)}
                value={String(schoolClass.level)}
              />
              <DetailField
                label={t(AppLocales.Admin.Campuses.Table.Status)}
                value={<StatusBadge status={schoolClass.status} />}
              />
              <DetailField
                label={t(AppLocales.Admin.Campuses.Classes.Table.Teachers)}
                value={String(schoolClass.teachers_count ?? 0)}
              />
              <DetailField
                label={t(AppLocales.Admin.Campuses.Classes.Table.Students)}
                value={String(schoolClass.students_count ?? 0)}
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection
            title={t(AppLocales.Admin.Campuses.ClassDetail.Teachers)}
            icon={iconsLib.userGroup}
            accent
          >
            <div className="space-y-4">
              {canAssign ? (
                <div className="space-y-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-body-s font-medium">
                        {t(AppLocales.Admin.Campuses.ClassDetail.AssignLabel)}
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={teacherUserId}
                        onChange={(e) => setTeacherUserId(e.target.value)}
                      >
                        <option value="">
                          {t(
                            AppLocales.Admin.Campuses.ClassDetail
                              .SelectCampusTeacher,
                          )}
                        </option>
                        {availableTeachers.map((membership) => (
                          <option
                            key={membership.id}
                            value={membership.user_id}
                          >
                            {membership.user?.name ||
                              membership.user?.username ||
                              membership.user_id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      size={ButtonSizes.SM}
                      className="sm:mb-0.5"
                      disabled={!teacherUserId}
                      onClick={() => void handleAssignTeacher()}
                    >
                      {t(AppLocales.Admin.Campuses.ClassDetail.Assign)}
                    </Button>
                  </div>
                  <p className="text-caption text-base-content/60">
                    {t(AppLocales.Admin.Campuses.ClassDetail.AssignHint)}
                  </p>
                </div>
              ) : null}

              {!isLoading && assignments.length === 0 ? (
                <AdminState
                  icon={iconsLib.userGroup}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.ClassDetail.TeachersEmpty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={assignmentColumns}
                    records={assignments}
                    getRowKey={(row) => row.id}
                  />
                  <AdminPagination
                    pagination={assignmentPagination}
                    onPageChange={setAssignmentPage}
                  />
                </>
              )}
            </div>
          </DetailSection>

          <DetailSection
            title={t(AppLocales.Admin.Campuses.ClassDetail.Students)}
            icon={iconsLib.user}
            accent
          >
            <div className="space-y-4">
              {canEnroll ? (
                <div className="space-y-3 rounded-xl border border-primary bg-base-100 p-4">
                  <AdminCampusUserSearch
                    label={t(AppLocales.Admin.Campuses.ClassDetail.EnrollLabel)}
                    selectedUser={studentToEnroll}
                    onSelect={setStudentToEnroll}
                  />
                  <p className="text-caption text-base-content/60">
                    {t(AppLocales.Admin.Campuses.ClassDetail.EnrollHint)}
                  </p>
                  <Button
                    size={ButtonSizes.SM}
                    disabled={!studentToEnroll}
                    onClick={() => void handleEnrollStudent()}
                  >
                    {t(AppLocales.Admin.Campuses.ClassDetail.Enroll)}
                  </Button>
                </div>
              ) : null}

              {!isLoading && enrollments.length === 0 ? (
                <AdminState
                  icon={iconsLib.user}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.ClassDetail.StudentsEmpty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={enrollmentColumns}
                    records={enrollments}
                    getRowKey={(row) => row.id}
                  />
                  <AdminPagination
                    pagination={enrollmentPagination}
                    onPageChange={setEnrollmentPage}
                  />
                </>
              )}

            </div>
          </DetailSection>

          <DetailSection
            title={t(AppLocales.Admin.Campuses.ClassDetail.Homework)}
            icon={iconsLib.document}
            accent
          >
            <div className="space-y-4">
              {canAssignHomework ? (
                <div className="flex justify-end">
                  <Button size={ButtonSizes.SM} onClick={openCreateHomework}>
                    {t(AppLocales.Admin.Campuses.ClassDetail.AssignHomework)}
                  </Button>
                </div>
              ) : null}

              {!isLoading && homeworks.length === 0 ? (
                <AdminState
                  icon={iconsLib.document}
                  title={t(AppLocales.Admin.Common.State.EmptyTitle)}
                  message={t(AppLocales.Admin.Campuses.ClassDetail.HomeworkEmpty)}
                />
              ) : (
                <>
                  <AdminTable
                    columns={homeworkColumns}
                    records={homeworks}
                    getRowKey={(row) => row.id}
                  />
                  <AdminPagination
                    pagination={homeworkPagination}
                    onPageChange={setHomeworkPage}
                  />
                </>
              )}
            </div>
          </DetailSection>
        </div>
      ) : null}

      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <ConfirmDialog
        isOpen={Boolean(discardAssignmentTarget)}
        title={t(AppLocales.Admin.Campuses.Confirm.UnassignTeacherTitle)}
        message={t(AppLocales.Admin.Campuses.Confirm.UnassignTeacherMessage)}
        confirmLabel={t(AppLocales.Admin.Campuses.ClassDetail.Unassign)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setDiscardAssignmentTarget(null)}
        onConfirm={handleDiscardAssignment}
      />
      <ConfirmDialog
        isOpen={Boolean(discardEnrollmentTarget)}
        title={t(AppLocales.Admin.Campuses.Confirm.UnenrollTitle)}
        message={t(AppLocales.Admin.Campuses.Confirm.UnenrollMessage)}
        confirmLabel={t(AppLocales.Admin.Campuses.ClassDetail.Unenroll)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setDiscardEnrollmentTarget(null)}
        onConfirm={handleDiscardEnrollment}
      />
      <ConfirmDialog
        isOpen={Boolean(discardHomeworkTarget)}
        title={t(AppLocales.Admin.Campuses.Confirm.DiscardHomeworkTitle)}
        message={t(AppLocales.Admin.Campuses.Confirm.DiscardHomeworkMessage)}
        confirmLabel={t(AppLocales.Admin.Campuses.ClassDetail.DiscardHomework)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setDiscardHomeworkTarget(null)}
        onConfirm={handleDiscardHomework}
      />
      {id ? (
        <AssignHomeworkDialog
          isOpen={homeworkDialogOpen}
          schoolClassId={id}
          homework={editingHomework}
          isSubmitting={homeworkSubmitting}
          onClose={() => {
            if (homeworkSubmitting) return;
            setHomeworkDialogOpen(false);
            setEditingHomework(null);
          }}
          onSubmit={(values) => void handleHomeworkSubmit(values)}
        />
      ) : null}
    </div>
  );
};

