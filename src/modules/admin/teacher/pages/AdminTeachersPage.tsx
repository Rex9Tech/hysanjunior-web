import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import { Button, DateTime, DateTimeFormats } from "../../../../design";
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
import { unwrapNested } from "../../campus/campus.helpers";
import type { IAdminCampus, IAdminCampusMembership } from "../../campus/types";
import {
  ADMIN_TEACHER_SORT_KEYS,
  ADMIN_TEACHER_TABLE_KEYS,
} from "../constants";
import TeacherController from "../teacher.controller";

export const AdminTeachersPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  useDocumentTitle(`${t(AppLocales.Admin.Teachers.Title)} | Admin`);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const campusId = searchParams.get("campus_id") || "";

  const [memberships, setMemberships] = useState<IAdminCampusMembership[]>([]);
  const [pagination, setPagination] = useState<IApiPagination | null>(null);
  const [error, setError] = useState("");
  const [campuses, setCampuses] = useState<IAdminCampus[]>([]);

  const { sortBy, sortOrder, handleSort } = useSort({
    defaultSortBy: ADMIN_TEACHER_SORT_KEYS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
  });

  const updateFilters = useCallback(
    (updates: { page?: number; campus_id?: string }) => {
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

  useEffect(() => {
    void loadCampuses();
  }, [loadCampuses]);

  const loadTeachers = useCallback(async () => {
    if (!can(ADMIN_ACTIONS.READ, ADMIN_RESOURCES.CAMPUS_MEMBERSHIPS)) return;

    setLoading(true);
    setError("");

    const result = await TeacherController.getTeachers({
      page,
      limit: ADMIN_PAGE_SIZE,
      campus_id: campusId || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (result.success) {
      setMemberships(result.memberships);
      setPagination(result.pagination);
    } else {
      const message =
        result.error || t(AppLocales.Admin.Teachers.Errors.LoadList);
      setError(message);
      toast.error(message);
    }
    setLoading(false);
  }, [campusId, can, page, setLoading, sortBy, sortOrder, t, toast]);

  useEffect(() => {
    if (permissionsLoading) return;
    const timeoutId = window.setTimeout(() => {
      void loadTeachers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTeachers, permissionsLoading]);

  const canCreate = can(ADMIN_ACTIONS.CREATE, ADMIN_RESOURCES.CAMPUS_MEMBERSHIPS);

  const columns = useMemo<IAdminTableColumn<IAdminCampusMembership>[]>(
    () => [
      {
        key: ADMIN_TEACHER_TABLE_KEYS.TEACHER,
        header: t(AppLocales.Admin.Teachers.Table.Teacher),
        render: (membership) => (
          <div>
            <div className="font-semibold text-base-content">
              {membership.user?.name || membership.user?.username || "—"}
            </div>
            <div className="text-caption text-base-content/60">
              {membership.user?.email}
            </div>
          </div>
        ),
      },
      {
        key: ADMIN_TEACHER_TABLE_KEYS.CAMPUS,
        header: t(AppLocales.Admin.Teachers.Table.Campus),
        render: (membership) => {
          const campus = unwrapNested(membership.campus);
          return campus?.name || "—";
        },
      },
      {
        key: ADMIN_TEACHER_TABLE_KEYS.KIND,
        header: t(AppLocales.Admin.Teachers.Table.Kind),
        sortKey: ADMIN_TEACHER_SORT_KEYS.KIND,
        render: (membership) => membership.kind,
      },
      {
        key: ADMIN_TEACHER_TABLE_KEYS.CREATED,
        header: t(AppLocales.Admin.Teachers.Table.Created),
        sortKey: ADMIN_TEACHER_SORT_KEYS.CREATED_AT,
        render: (membership) =>
          membership.created_at ? (
            <DateTime
              value={membership.created_at}
              format={DateTimeFormats.DATE_TIME}
            />
          ) : (
            "—"
          ),
      },
      {
        key: ADMIN_TEACHER_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (membership) => (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              navigate(
                AppRoutes.withId(
                  AppRoutes.client.protected.admin.TEACHER_DETAIL,
                  membership.id,
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
        title={t(AppLocales.Admin.Teachers.Title)}
        description={t(AppLocales.Admin.Teachers.Description)}
        action={
          canCreate ? (
            <Button
              onClick={() =>
                navigate(AppRoutes.client.protected.admin.TEACHER_CREATE)
              }
            >
              <iconsLib.plus className="mr-2 h-4 w-4" />
              {t(AppLocales.Admin.Teachers.CreateButton)}
            </Button>
          ) : null
        }
      >
        <div className="w-full sm:w-72">
          <Dropdown
            label={t(AppLocales.Admin.Teachers.Filters.Campus)}
            value={campusId}
            onValueChange={(value) =>
              updateFilters({ campus_id: value, page: 1 })
            }
            placeholder={t(AppLocales.Admin.Teachers.Filters.AllCampuses)}
            options={campuses.map((campus) => ({
              value: campus.id,
              label: campus.name,
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
      ) : !isLoading && memberships.length === 0 ? (
        <AdminState
          icon={iconsLib.user}
          title={t(AppLocales.Admin.Common.State.EmptyTitle)}
          message={t(AppLocales.Admin.Teachers.Empty)}
        />
      ) : (
        <>
          <AdminTable
            columns={columns}
            records={memberships}
            getRowKey={(membership) => membership.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(membership) =>
              navigate(
                AppRoutes.withId(
                  AppRoutes.client.protected.admin.TEACHER_DETAIL,
                  membership.id,
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
