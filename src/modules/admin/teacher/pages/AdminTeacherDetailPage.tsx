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
} from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle, usePermissions } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  AdminState,
  AdminTable,
  AlertDialog,
  ConfirmDialog,
  Dropdown,
  type IAdminTableColumn,
} from "../../components";
import { ADMIN_ACTIONS, ADMIN_RESOURCES } from "../../constants";
import { useAdminDetail } from "../../hooks/useAdminDetail";
import SchoolClassController from "../../campus/school_class.controller";
import { unwrapNested } from "../../campus/campus.helpers";
import type {
  IAdminCampusMembership,
  IAdminClassAssignment,
  IAdminSchoolClass,
} from "../../campus/types";
import TeacherController from "../teacher.controller";

const loadMembership = async (id: string) => {
  const result = await TeacherController.getTeacherMembership(id);
  return { ...result, record: result.membership };
};

export const AdminTeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can } = usePermissions();
  const {
    record: membership,
    error,
  } = useAdminDetail<IAdminCampusMembership>(id, loadMembership);

  const campus = unwrapNested(membership?.campus);
  const teacherName =
    membership?.user?.name ||
    membership?.user?.username ||
    t(AppLocales.Admin.Teachers.Detail.Title);

  useDocumentTitle(`${teacherName} | Admin`);

  const canAssign = can(ADMIN_ACTIONS.CREATE, ADMIN_RESOURCES.CLASS_ASSIGNMENTS);
  const canUnassign = can(
    ADMIN_ACTIONS.DELETE,
    ADMIN_RESOURCES.CLASS_ASSIGNMENTS,
  );
  const canRemoveCampus = can(
    ADMIN_ACTIONS.DELETE,
    ADMIN_RESOURCES.CAMPUS_MEMBERSHIPS,
  );

  const [alertMessage, setAlertMessage] = useState("");
  const [assignments, setAssignments] = useState<IAdminClassAssignment[]>([]);
  const [campusClasses, setCampusClasses] = useState<IAdminSchoolClass[]>([]);
  const [classToAssign, setClassToAssign] = useState("");
  const [unassignTarget, setUnassignTarget] =
    useState<IAdminClassAssignment | null>(null);
  const [removeCampusOpen, setRemoveCampusOpen] = useState(false);

  const loadAssignments = useCallback(
    async (userId: string, campusId?: string) => {
      const result = await TeacherController.getClassAssignments(
        userId,
        campusId,
      );
      if (result.success) setAssignments(result.assignments);
      else setAssignments([]);
    },
    [],
  );

  const loadCampusClasses = useCallback(async (campusId: string) => {
    const result = await SchoolClassController.getSchoolClasses({
      campus_id: campusId,
      limit: 100,
      status: "active",
    });
    if (result.success) setCampusClasses(result.schoolClasses);
    else setCampusClasses([]);
  }, []);

  useEffect(() => {
    if (!membership?.user_id) return;
    void loadAssignments(membership.user_id, membership.campus_id);
  }, [loadAssignments, membership?.campus_id, membership?.user_id]);

  useEffect(() => {
    if (!campus?.id) return;
    void loadCampusClasses(campus.id);
  }, [campus?.id, loadCampusClasses]);

  const assignedClassIds = useMemo(
    () => new Set(assignments.map((item) => item.school_class_id)),
    [assignments],
  );

  const availableClasses = useMemo(
    () => campusClasses.filter((item) => !assignedClassIds.has(item.id)),
    [assignedClassIds, campusClasses],
  );

  const handleAssign = async () => {
    if (!membership?.user_id || !classToAssign) return;
    setLoading(true, { overlay: false });
    const result = await TeacherController.assignClass(
      membership.user_id,
      classToAssign,
    );
    setLoading(false, { overlay: false });

    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Teachers.Toasts.AssignClassSuccess),
      );
      setClassToAssign("");
      await loadAssignments(membership.user_id, membership.campus_id);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Teachers.Errors.AssignClass),
      );
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget || !membership?.user_id) return;
    setLoading(true, { overlay: false });
    const result = await TeacherController.unassignClass(unassignTarget.id);
    setLoading(false, { overlay: false });
    setUnassignTarget(null);

    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Teachers.Toasts.UnassignClassSuccess),
      );
      await loadAssignments(membership.user_id, membership.campus_id);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Teachers.Errors.UnassignClass),
      );
    }
  };

  const handleRemoveCampus = async () => {
    if (!membership) return;
    setLoading(true, { overlay: false });
    const result = await TeacherController.removeFromCampus(membership.id);
    setLoading(false, { overlay: false });
    setRemoveCampusOpen(false);

    if (result.success) {
      toast.success(
        result.message ||
          t(AppLocales.Admin.Teachers.Toasts.RemoveCampusSuccess),
      );
      navigate(AppRoutes.client.protected.admin.TEACHERS);
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Teachers.Errors.RemoveCampus),
      );
    }
  };

  const assignmentColumns = useMemo<IAdminTableColumn<IAdminClassAssignment>[]>(
    () => [
      {
        key: "class",
        header: t(AppLocales.Admin.Teachers.Detail.ClassColumn),
        render: (assignment) => {
          const schoolClass = unwrapNested(assignment.school_class);
          return schoolClass
            ? `L${schoolClass.level} · ${schoolClass.name}`
            : "—";
        },
      },
      {
        key: "actions",
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (assignment) =>
          canUnassign ? (
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              onClick={() => setUnassignTarget(assignment)}
            >
              {t(AppLocales.Admin.Teachers.Detail.Unassign)}
            </Button>
          ) : null,
      },
    ],
    [canUnassign, t],
  );

  if (error) {
    return (
      <AdminState
        icon={iconsLib.warning}
        title={t(AppLocales.Admin.Common.State.ErrorTitle)}
        message={error}
        actionLabel={t(AppLocales.Admin.Common.Actions.Back)}
        onAction={() => navigate(AppRoutes.client.protected.admin.TEACHERS)}
      />
    );
  }

  if (!membership) {
    return isLoading ? null : (
      <AdminState
        icon={iconsLib.user}
        title={t(AppLocales.Admin.Common.State.EmptyTitle)}
        message={t(AppLocales.Admin.Teachers.Errors.LoadOne)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title={teacherName}
        description={t(AppLocales.Admin.Teachers.Detail.Description)}
        backTo={AppRoutes.client.protected.admin.TEACHERS}
        backLabel={t(AppLocales.Admin.Teachers.Title)}
      />

      <DetailSection
        title={t(AppLocales.Admin.Teachers.Detail.Overview)}
        icon={iconsLib.user}
      >
        <DetailGrid>
          <DetailField
            label={t(AppLocales.Admin.Teachers.Table.Teacher)}
            value={membership.user?.name || membership.user?.username || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Users.Table.Email)}
            value={membership.user?.email || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Teachers.Table.Campus)}
            value={campus?.name || "—"}
          />
          <DetailField
            label={t(AppLocales.Admin.Teachers.Table.Kind)}
            value={membership.kind}
          />
        </DetailGrid>
        {campus?.id ? (
          <p className="mt-3 text-caption text-base-content/60">
            <button
              type="button"
              className="link link-hover"
              onClick={() =>
                navigate(
                  AppRoutes.withId(
                    AppRoutes.client.protected.admin.CAMPUS_DETAIL,
                    campus.id,
                  ) + "?tab=teachers",
                )
              }
            >
              {t(AppLocales.Admin.Teachers.Detail.OpenCampus)}
            </button>
          </p>
        ) : null}
        {canRemoveCampus ? (
          <div className="mt-4">
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              onClick={() => setRemoveCampusOpen(true)}
            >
              {t(AppLocales.Admin.Teachers.Detail.RemoveCampus)}
            </Button>
          </div>
        ) : null}
      </DetailSection>

      <DetailSection
        title={t(AppLocales.Admin.Teachers.Detail.Classes)}
        icon={iconsLib.document}
      >
        <div className="space-y-4">
          <p className="text-caption text-base-content/60">
            {t(AppLocales.Admin.Teachers.Detail.ClassesHint)}
          </p>

          {canAssign ? (
            <div className="grid gap-3 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-[1fr_auto] md:items-end">
              <Dropdown
                label={t(AppLocales.Admin.Teachers.Detail.AssignLabel)}
                value={classToAssign}
                onValueChange={setClassToAssign}
                placeholder={t(AppLocales.Admin.Teachers.Detail.AssignPlaceholder)}
                options={availableClasses.map((item) => ({
                  value: item.id,
                  label: `L${item.level} · ${item.name}`,
                }))}
              />
              <Button
                size={ButtonSizes.SM}
                disabled={!classToAssign}
                onClick={() => void handleAssign()}
              >
                {t(AppLocales.Admin.Teachers.Detail.Assign)}
              </Button>
            </div>
          ) : null}

          {assignments.length === 0 ? (
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Teachers.Detail.ClassesEmpty)}
            </p>
          ) : (
            <AdminTable
              columns={assignmentColumns}
              records={assignments}
              getRowKey={(row) => row.id}
            />
          )}
        </div>
      </DetailSection>

      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <ConfirmDialog
        isOpen={Boolean(unassignTarget)}
        title={t(AppLocales.Admin.Teachers.Confirm.UnassignTitle)}
        message={t(AppLocales.Admin.Teachers.Confirm.UnassignMessage)}
        confirmLabel={t(AppLocales.Admin.Teachers.Detail.Unassign)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setUnassignTarget(null)}
        onConfirm={() => void handleUnassign()}
      />
      <ConfirmDialog
        isOpen={removeCampusOpen}
        title={t(AppLocales.Admin.Teachers.Confirm.RemoveCampusTitle)}
        message={t(AppLocales.Admin.Teachers.Confirm.RemoveCampusMessage)}
        confirmLabel={t(AppLocales.Admin.Teachers.Detail.RemoveCampus)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        isLoading={isLoading}
        onClose={() => setRemoveCampusOpen(false)}
        onConfirm={() => void handleRemoveCampus()}
      />
    </div>
  );
};
