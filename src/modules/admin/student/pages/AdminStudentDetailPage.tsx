import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DetailField,
  DetailGrid,
  DetailHeader,
  DetailSection,
  StatusBadge,
} from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import type { IApiPagination } from "../../../../models";
import { useDocumentTitle, usePermissions } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  AdminPagination,
  AdminState,
  AdminTable,
  AlertDialog,
  ConfirmDialog,
  Dropdown,
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_ACTIONS,
  ADMIN_PAGE_SIZE,
  ADMIN_RESOURCES,
} from "../../constants";
import { useAdminDetail } from "../../hooks/useAdminDetail";
import { AdminCampusUserSearch } from "../../campus/pages/AdminCampusUserSearch";
import ClassHomeworkController from "../../campus/class_homework.controller";
import ParentStudentController from "../../campus/parent_student.controller";
import SchoolClassController from "../../campus/school_class.controller";
import { unwrapNested } from "../../campus/campus.helpers";
import {
  ADMIN_CAMPUS_LEVELS,
  ADMIN_CLASS_HOMEWORK_TABLE_KEYS,
} from "../../campus/constants";
import type {
  IAdminClassEnrollment,
  IAdminClassHomework,
  IAdminParentStudent,
  IAdminSchoolClass,
} from "../../campus/types";
import type { IAdminUser } from "../../user/types";
import StudentController from "../student.controller";


const loadEnrollment = async (id: string) => {
  const result = await StudentController.getStudentEnrollment(id);
  return { ...result, record: result.enrollment };
};

export const AdminStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can } = usePermissions();
  const {
    record: enrollment,
    error,
    reload,
  } = useAdminDetail<IAdminClassEnrollment>(id, loadEnrollment);

  const schoolClass = unwrapNested(enrollment?.school_class);
  const campus = unwrapNested(schoolClass?.campus);
  const studentName =
    enrollment?.student?.name ||
    enrollment?.student?.username ||
    t(AppLocales.Admin.Students.Detail.Title);

  useDocumentTitle(`${studentName} | Admin`);

  const canUpdateEnrollment = can(
    ADMIN_ACTIONS.UPDATE,
    ADMIN_RESOURCES.CLASS_ENROLLMENTS,
  );
  const canLinkParent = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.PARENT_STUDENTS,
  );
  const canUnlinkParent = can(
    ADMIN_ACTIONS.DELETE,
    ADMIN_RESOURCES.PARENT_STUDENTS,
  );
  const canReadHomework = can(
    ADMIN_ACTIONS.READ,
    ADMIN_RESOURCES.CLASS_HOMEWORKS,
  );

  const [alertMessage, setAlertMessage] = useState("");
  const [parentLinks, setParentLinks] = useState<IAdminParentStudent[]>([]);
  const [parentToLink, setParentToLink] = useState<IAdminUser | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<IAdminParentStudent | null>(
    null,
  );

  const [campusClasses, setCampusClasses] = useState<IAdminSchoolClass[]>([]);
  const [changeLevel, setChangeLevel] = useState("");
  const [changeClassId, setChangeClassId] = useState("");

  const [homeworks, setHomeworks] = useState<IAdminClassHomework[]>([]);
  const [homeworkPagination, setHomeworkPagination] =
    useState<IApiPagination | null>(null);
  const [homeworkPage, setHomeworkPage] = useState(1);

  const loadParents = useCallback(async (studentId: string) => {
    const result = await ParentStudentController.getParentStudents({
      student_id: studentId,
      limit: 50,
    });
    if (result.success) setParentLinks(result.links);
    else setParentLinks([]);
  }, []);

  const loadCampusClasses = useCallback(async (campusId: string) => {
    const result = await SchoolClassController.getSchoolClasses({
      campus_id: campusId,
      limit: 100,
      status: "active",
    });
    if (result.success) setCampusClasses(result.schoolClasses);
    else setCampusClasses([]);
  }, []);

  const loadHomeworks = useCallback(
    async (schoolClassId: string) => {
      if (!canReadHomework) {
        setHomeworks([]);
        setHomeworkPagination(null);
        return;
      }
      const result = await ClassHomeworkController.getHomeworks({
        school_class_id: schoolClassId,
        page: homeworkPage,
        limit: ADMIN_PAGE_SIZE,
      });
      if (result.success) {
        setHomeworks(result.homeworks);
        setHomeworkPagination(result.pagination);
      } else {
        setHomeworks([]);
        setHomeworkPagination(null);
        setAlertMessage(
          result.error || t(AppLocales.Admin.Students.Errors.LoadHomeworks),
        );
      }
    },
    [canReadHomework, homeworkPage, t],
  );

  useEffect(() => {
    if (!enrollment?.user_id) return;
    void loadParents(enrollment.user_id);
  }, [enrollment?.user_id, loadParents]);

  useEffect(() => {
    if (!campus?.id) return;
    void loadCampusClasses(campus.id);
    if (schoolClass) {
      setChangeLevel(String(schoolClass.level));
      setChangeClassId(schoolClass.id);
    }
  }, [campus?.id, loadCampusClasses, schoolClass]);

  useEffect(() => {
    if (!enrollment?.school_class_id) return;
    void loadHomeworks(enrollment.school_class_id);
  }, [enrollment?.school_class_id, loadHomeworks]);

  useEffect(() => {
    setHomeworkPage(1);
  }, [enrollment?.school_class_id]);


  const classesForLevel = useMemo(() => {
    if (!changeLevel) return campusClasses;
    return campusClasses.filter((item) => String(item.level) === changeLevel);
  }, [campusClasses, changeLevel]);

  const homeworkColumns = useMemo<IAdminTableColumn<IAdminClassHomework>[]>(
    () => [
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.LESSON,
        header: t(AppLocales.Admin.Students.Detail.HomeworkTable.Lesson),
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
        header: t(AppLocales.Admin.Students.Detail.HomeworkTable.Activities),
        render: (row) =>
          (row.activity_labels || row.activity_keys).join(" → ") || "—",
      },
      {
        key: ADMIN_CLASS_HOMEWORK_TABLE_KEYS.INTROS,
        header: t(AppLocales.Admin.Students.Detail.HomeworkTable.Intros),
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
        header: t(AppLocales.Admin.Students.Detail.HomeworkTable.Due),
        render: (row) => row.due_on || "—",
      },
    ],
    [t],
  );

  const handleChangeClass = async () => {

    if (!enrollment || !changeClassId) return;
    if (changeClassId === enrollment.school_class_id) {
      toast.success(t(AppLocales.Admin.Students.Toasts.ClassUnchanged));
      return;
    }

    setLoading(true, { overlay: false });
    const result = await StudentController.changeClass(
      enrollment.id,
      changeClassId,
    );
    setLoading(false, { overlay: false });

    if (result.success) {
      toast.success(
        result.message || t(AppLocales.Admin.Students.Toasts.ChangeClassSuccess),
      );
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Students.Errors.ChangeClass),
      );
    }
  };

  const handleLinkParent = async () => {
    if (!enrollment?.user_id || !parentToLink) return;
    setLoading(true, { overlay: false });
    const result = await StudentController.linkParent(
      enrollment.user_id,
      parentToLink.id,
    );
    setLoading(false, { overlay: false });

    if (result.success) {
      toast.success(
        result.message || t(AppLocales.Admin.Students.Toasts.LinkParentSuccess),
      );
      setParentToLink(null);
      await loadParents(enrollment.user_id);
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Students.Errors.LinkParent),
      );
    }
  };

  const handleUnlinkParent = async () => {
    if (!unlinkTarget || !enrollment?.user_id) return;
    setLoading(true, { overlay: false });
    const result = await StudentController.unlinkParent(unlinkTarget.id);
    setLoading(false, { overlay: false });
    setUnlinkTarget(null);

    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Students.Toasts.UnlinkParentSuccess),
      );
      await loadParents(enrollment.user_id);
      reload();
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Students.Errors.UnlinkParent),
      );
    }
  };

  if (error) {
    return (
      <AdminState
        icon={iconsLib.warning}
        title={t(AppLocales.Admin.Common.State.ErrorTitle)}
        message={error}
        actionLabel={t(AppLocales.Admin.Common.Actions.Back)}
        onAction={() => navigate(AppRoutes.client.protected.admin.STUDENTS)}
      />
    );
  }

  if (!enrollment) {
    return isLoading ? null : (
      <AdminState
        icon={iconsLib.user}
        title={t(AppLocales.Admin.Common.State.EmptyTitle)}
        message={t(AppLocales.Admin.Students.Errors.LoadOne)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        breadcrumbs={[
          {
            label: t(AppLocales.Admin.Common.Detail.Admin),
            to: AppRoutes.client.protected.admin.HOME,
          },
          {
            label: t(AppLocales.Admin.Students.Title),
            to: AppRoutes.client.protected.admin.STUDENTS,
          },
          { label: studentName },
        ]}
        title={studentName}
        description={t(AppLocales.Admin.Students.Detail.Description)}
        backTo={AppRoutes.client.protected.admin.STUDENTS}
        backLabel={t(AppLocales.Admin.Students.Title)}
      />

      <DetailSection
        title={t(AppLocales.Admin.Students.Detail.Overview)}
        icon={iconsLib.user}
      >
        <DetailGrid>
          <DetailField
            label={t(AppLocales.Admin.Students.Table.Student)}
            value={
              enrollment.student?.name || enrollment.student?.username || "—"
            }
          />
          <DetailField
            label={t(AppLocales.Admin.Users.Table.Email)}
            value={enrollment.student?.email || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Students.Table.Campus)}
            value={campus?.name || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Students.Table.Level)}
            value={schoolClass ? `L${schoolClass.level}` : "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Students.Table.Class)}
            value={schoolClass?.name || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Students.Table.Status)}
            value={<StatusBadge status={enrollment.status} />}
          />
        </DetailGrid>
      </DetailSection>

      {canUpdateEnrollment && campus ? (
        <DetailSection
          title={t(AppLocales.Admin.Students.Detail.ChangeClass)}
          icon={iconsLib.document}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Dropdown
              label={t(AppLocales.Admin.Students.Form.LevelLabel)}
              value={changeLevel}
              onValueChange={(value) => {
                setChangeLevel(value);
                setChangeClassId("");
              }}
              options={ADMIN_CAMPUS_LEVELS.map((item) => ({
                value: String(item),
                label: t(AppLocales.Admin.Campuses.ClassForm.LevelOption, {
                  level: item,
                }),
              }))}
            />
            <Dropdown
              label={t(AppLocales.Admin.Students.Form.ClassLabel)}
              value={changeClassId}
              onValueChange={setChangeClassId}
              options={classesForLevel.map((item) => ({
                value: item.id,
                label: `L${item.level} · ${item.name}`,
              }))}
            />
            <div className="flex items-end">
              <Button
                size={ButtonSizes.SM}
                disabled={!changeClassId}
                onClick={() => void handleChangeClass()}
              >
                {t(AppLocales.Admin.Students.Detail.SaveClass)}
              </Button>
            </div>
          </div>
          {campus.id ? (
            <p className="mt-3 text-caption text-base-content/60">
              <button
                type="button"
                className="link link-hover"
                onClick={() =>
                  navigate(
                    AppRoutes.withId(
                      AppRoutes.client.protected.admin.CAMPUS_DETAIL,
                      campus.id,
                    ) + "?tab=students",
                  )
                }
              >
                {t(AppLocales.Admin.Students.Detail.OpenCampus)}
              </button>
              {schoolClass ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="link link-hover"
                    onClick={() =>
                      navigate(
                        AppRoutes.withId(
                          AppRoutes.client.protected.admin.SCHOOL_CLASS_DETAIL,
                          schoolClass.id,
                        ),
                      )
                    }
                  >
                    {t(AppLocales.Admin.Students.Detail.OpenClass)}
                  </button>
                </>
              ) : null}
            </p>
          ) : null}
        </DetailSection>
      ) : null}

      {canReadHomework ? (
        <DetailSection
          title={t(AppLocales.Admin.Students.Detail.Homework)}
          icon={iconsLib.document}
        >
          <div className="space-y-4">
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Students.Detail.HomeworkHint)}
            </p>
            {homeworks.length === 0 ? (
              <p className="text-caption text-base-content/60">
                {t(AppLocales.Admin.Students.Detail.HomeworkEmpty)}
              </p>
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
      ) : null}

      <DetailSection
        title={t(AppLocales.Admin.Students.Detail.Parents)}
        icon={iconsLib.userGroup}
      >

        <div className="space-y-4">
          {canLinkParent ? (
            <div className="space-y-3 rounded-xl border border-primary/40 bg-base-100 p-4">
              <AdminCampusUserSearch
                label={t(AppLocales.Admin.Students.Form.ParentSearchLabel)}
                selectedUser={parentToLink}
                onSelect={setParentToLink}
                placeholder={t(
                  AppLocales.Admin.Students.Form.ParentSearchPlaceholder,
                )}
              />
              <Button
                size={ButtonSizes.SM}
                disabled={!parentToLink}
                onClick={() => void handleLinkParent()}
              >
                {t(AppLocales.Admin.Students.Detail.LinkParent)}
              </Button>
            </div>
          ) : null}

          {parentLinks.length === 0 ? (
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Students.Detail.ParentsEmpty)}
            </p>
          ) : (
            <ul className="divide-y divide-base-300 rounded-lg border border-base-300">
              {parentLinks.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {link.parent?.name ||
                        link.parent?.username ||
                        link.parent_id}
                    </p>
                    <p className="text-caption text-base-content/60">
                      {link.parent?.email}
                    </p>
                  </div>
                  {canUnlinkParent ? (
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.FLAT}
                      onClick={() => setUnlinkTarget(link)}
                    >
                      {t(AppLocales.Admin.Students.Detail.UnlinkParent)}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <ConfirmDialog
        isOpen={Boolean(unlinkTarget)}
        title={t(AppLocales.Admin.Students.Confirm.UnlinkParentTitle)}
        message={t(AppLocales.Admin.Students.Confirm.UnlinkParentMessage)}
        confirmLabel={t(AppLocales.Admin.Students.Detail.UnlinkParent)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={() => void handleUnlinkParent()}
      />
    </div>
  );
};
