import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import { Button, StatusBadge } from "../../../../design";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  SORT_ORDERS,
  useDocumentTitle,
  usePermissions,
  useSort,
} from "../../../../hooks";
import type { IApiPagination } from "../../../../models";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  AdminPagination,
  AdminState,
  AdminTable,
  Dropdown,
  PageHeader,
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_ACTIONS,
  ADMIN_PAGE_SIZE,
  ADMIN_RESOURCES,
} from "../../constants";
import CampusController from "../../campus/campus.controller";
import SchoolClassController from "../../campus/school_class.controller";
import { unwrapNested } from "../../campus/campus.helpers";
import { ADMIN_CAMPUS_LEVELS } from "../../campus/constants";
import type {
  IAdminCampus,
  IAdminClassEnrollment,
  IAdminSchoolClass,
} from "../../campus/types";
import {
  ADMIN_STUDENT_SORT_KEYS,
  ADMIN_STUDENT_TABLE_KEYS,
} from "../constants";
import StudentController from "../student.controller";

export const AdminStudentsPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  useDocumentTitle(`${t(AppLocales.Admin.Students.Title)} | Admin`);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const campusId = searchParams.get("campus_id") || "";
  const level = searchParams.get("level") || "";
  const schoolClassId = searchParams.get("school_class_id") || "";

  const [enrollments, setEnrollments] = useState<IAdminClassEnrollment[]>([]);
  const [pagination, setPagination] = useState<IApiPagination | null>(null);
  const [error, setError] = useState("");
  const [campuses, setCampuses] = useState<IAdminCampus[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<IAdminSchoolClass[]>([]);

  const { sortBy, sortOrder, handleSort } = useSort({
    defaultSortBy: ADMIN_STUDENT_SORT_KEYS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
  });

  const updateFilters = useCallback(
    (updates: {
      page?: number;
      campus_id?: string;
      level?: string;
      school_class_id?: string;
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (updates.page !== undefined) {
            if (updates.page > 1) next.set("page", updates.page.toString());
            else next.delete("page");
          }
          if (updates.campus_id !== undefined) {
            if (updates.campus_id) next.set("campus_id", updates.campus_id);
            else next.delete("campus_id");
            next.delete("school_class_id");
          }
          if (updates.level !== undefined) {
            if (updates.level) next.set("level", updates.level);
            else next.delete("level");
            next.delete("school_class_id");
          }
          if (updates.school_class_id !== undefined) {
            if (updates.school_class_id) {
              next.set("school_class_id", updates.school_class_id);
            } else {
              next.delete("school_class_id");
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadCampuses = useCallback(async () => {
    const result = await CampusController.getCampuses({ limit: 100 });
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

  const classesForLevel = useMemo(() => {
    if (!level) return schoolClasses;
    return schoolClasses.filter((item) => String(item.level) === level);
  }, [level, schoolClasses]);

  const loadStudents = useCallback(async () => {
    if (!can(ADMIN_ACTIONS.READ, ADMIN_RESOURCES.CLASS_ENROLLMENTS)) return;

    setLoading(true);
    setError("");

    const result = await StudentController.getStudents({
      page,
      limit: ADMIN_PAGE_SIZE,
      campus_id: campusId || undefined,
      level: level || undefined,
      school_class_id: schoolClassId || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (result.success) {
      setEnrollments(result.enrollments);
      setPagination(result.pagination);
    } else {
      const message =
        result.error || t(AppLocales.Admin.Students.Errors.LoadList);
      setError(message);
      toast.error(message);
    }
    setLoading(false);
  }, [
    campusId,
    can,
    level,
    page,
    schoolClassId,
    setLoading,
    sortBy,
    sortOrder,
    t,
    toast,
  ]);

  useEffect(() => {
    if (permissionsLoading) return;
    const timeoutId = window.setTimeout(() => {
      void loadStudents();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStudents, permissionsLoading]);

  const canCreate = can(
    ADMIN_ACTIONS.CREATE,
    ADMIN_RESOURCES.CLASS_ENROLLMENTS,
  );

  const columns = useMemo<IAdminTableColumn<IAdminClassEnrollment>[]>(
    () => [
      {
        key: ADMIN_STUDENT_TABLE_KEYS.STUDENT,
        header: t(AppLocales.Admin.Students.Table.Student),
        render: (enrollment) => (
          <div>
            <div className="font-semibold text-base-content">
              {enrollment.student?.name || enrollment.student?.username || "—"}
            </div>
            <div className="text-caption text-base-content/60">
              {enrollment.student?.email}
            </div>
          </div>
        ),
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.CAMPUS,
        header: t(AppLocales.Admin.Students.Table.Campus),
        render: (enrollment) => {
          const schoolClass = unwrapNested(enrollment.school_class);
          const campus = unwrapNested(schoolClass?.campus);
          return campus?.name || "—";
        },
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.LEVEL,
        header: t(AppLocales.Admin.Students.Table.Level),
        className: "text-center",
        render: (enrollment) => {
          const schoolClass = unwrapNested(enrollment.school_class);
          return schoolClass ? `L${schoolClass.level}` : "—";
        },
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.CLASS,
        header: t(AppLocales.Admin.Students.Table.Class),
        render: (enrollment) => {
          const schoolClass = unwrapNested(enrollment.school_class);
          return schoolClass?.name || "—";
        },
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.STATUS,
        header: t(AppLocales.Admin.Students.Table.Status),
        sortKey: ADMIN_STUDENT_SORT_KEYS.STATUS,
        className: "text-center",
        render: (enrollment) => <StatusBadge status={enrollment.status} />,
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.PARENTS,
        header: t(AppLocales.Admin.Students.Table.Parents),
        render: (enrollment) => {
          const parents = enrollment.parents || [];
          if (parents.length === 0) {
            return (
              <span className="text-base-content/50">
                {t(AppLocales.Admin.Students.Table.NoParents)}
              </span>
            );
          }
          return parents
            .map((parent) => parent.name || parent.username)
            .join(", ");
        },
      },
      {
        key: ADMIN_STUDENT_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (enrollment) => (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              navigate(
                AppRoutes.withId(
                  AppRoutes.client.protected.admin.STUDENT_DETAIL,
                  enrollment.id,
                ),
              );
            }}
          >
            <iconsLib.eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(AppLocales.Admin.Students.Title)}
        description={t(AppLocales.Admin.Students.Description)}
        action={
          canCreate ? (
            <Button
              onClick={() =>
                navigate(AppRoutes.client.protected.admin.STUDENT_CREATE)
              }
            >
              <iconsLib.plus className="mr-2 h-4 w-4" />
              {t(AppLocales.Admin.Students.CreateButton)}
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Dropdown
            label={t(AppLocales.Admin.Students.Filters.Campus)}
            value={campusId}
            onValueChange={(value) =>
              updateFilters({ campus_id: value, page: 1 })
            }
            placeholder={t(AppLocales.Admin.Students.Filters.AllCampuses)}
            options={campuses.map((campus) => ({
              value: campus.id,
              label: campus.name,
            }))}
          />
          <Dropdown
            label={t(AppLocales.Admin.Students.Filters.Level)}
            value={level}
            onValueChange={(value) => updateFilters({ level: value, page: 1 })}
            placeholder={t(AppLocales.Admin.Students.Filters.AllLevels)}
            options={ADMIN_CAMPUS_LEVELS.map((item) => ({
              value: String(item),
              label: t(AppLocales.Admin.Campuses.ClassForm.LevelOption, {
                level: item,
              }),
            }))}
          />
          <Dropdown
            label={t(AppLocales.Admin.Students.Filters.Class)}
            value={schoolClassId}
            onValueChange={(value) =>
              updateFilters({ school_class_id: value, page: 1 })
            }
            placeholder={t(AppLocales.Admin.Students.Filters.AllClasses)}
            options={classesForLevel.map((schoolClass) => ({
              value: schoolClass.id,
              label: `L${schoolClass.level} · ${schoolClass.name}`,
            }))}
          />
        </div>
      </PageHeader>

      {error ? (
        <AdminState
          icon={iconsLib.warning}
          title={t(AppLocales.Admin.Common.State.ErrorTitle)}
          message={error}
        />
      ) : !isLoading && enrollments.length === 0 ? (
        <AdminState
          icon={iconsLib.userGroup}
          title={t(AppLocales.Admin.Common.State.EmptyTitle)}
          message={t(AppLocales.Admin.Students.Empty)}
        />
      ) : (
        <>
          <AdminTable
            columns={columns}
            records={enrollments}
            getRowKey={(enrollment) => enrollment.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(enrollment) =>
              navigate(
                AppRoutes.withId(
                  AppRoutes.client.protected.admin.STUDENT_DETAIL,
                  enrollment.id,
                ),
              )
            }
          />
          <AdminPagination
            pagination={pagination}
            onPageChange={(nextPage) => updateFilters({ page: nextPage })}
          />
        </>
      )}
    </div>
  );
};
