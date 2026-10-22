import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DateTime,
  DateTimeFormats,
  Image,
  SearchInput,
  StatusBadge,
} from "../../../../design";
import { unwrapNested } from "../campus.helpers";

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
  AdminTableActions,
  ConfirmDialog,
  PageHeader,
  Tabs,
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_ACTIONS,
  ADMIN_PAGE_SIZE,
  ADMIN_RESOURCES,
  ADMIN_VIEW_MODES,
  type TAdminViewMode,
} from "../../constants";
import CampusController from "../campus.controller";
import {
  ADMIN_CAMPUS_SORT_KEYS,
  ADMIN_CAMPUS_TABLE_KEYS,
} from "../constants";
import type { IAdminCampus } from "../types";

export const AdminCampusesPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const view: TAdminViewMode =
    searchParams.get("discarded") === "true"
      ? ADMIN_VIEW_MODES.DISCARDED
      : ADMIN_VIEW_MODES.ACTIVE;
  const isDiscardedView = view === ADMIN_VIEW_MODES.DISCARDED;

  useDocumentTitle(
    `${
      isDiscardedView
        ? t(AppLocales.Admin.Campuses.RecycleTitle)
        : t(AppLocales.Admin.Campuses.Title)
    } | Admin`,
  );

  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [campuses, setCampuses] = useState<IAdminCampus[]>([]);
  const [pagination, setPagination] = useState<IApiPagination | null>(null);
  const [error, setError] = useState("");
  const [lifecycleTarget, setLifecycleTarget] = useState<IAdminCampus | null>(
    null,
  );

  const { sortBy, sortOrder, handleSort } = useSort({
    defaultSortBy: isDiscardedView
      ? ADMIN_CAMPUS_SORT_KEYS.DISCARDED_AT
      : ADMIN_CAMPUS_SORT_KEYS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
  });

  const updateFilters = useCallback(
    (updates: { page?: number; search?: string; discarded?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (updates.page !== undefined) {
            if (updates.page > 1) next.set("page", updates.page.toString());
            else next.delete("page");
          }
          if (updates.search !== undefined) {
            if (updates.search.trim()) next.set("search", updates.search.trim());
            else next.delete("search");
          }
          if (updates.discarded !== undefined) {
            if (updates.discarded) next.set("discarded", "true");
            else next.delete("discarded");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearchInput(searchQuery), 0);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) {
        updateFilters({ search: searchInput.trim(), page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, updateFilters]);

  const loadCampuses = useCallback(async () => {
    if (!can(ADMIN_ACTIONS.READ, ADMIN_RESOURCES.CAMPUSES)) return;

    setLoading(true);
    setError("");

    const result = await CampusController.getCampuses({
      page,
      limit: ADMIN_PAGE_SIZE,
      search: searchQuery.trim() || undefined,
      discarded: isDiscardedView || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (result.success) {
      setCampuses(result.campuses);
      setPagination(result.pagination);
    } else {
      setError(result.error || t(AppLocales.Admin.Campuses.Errors.LoadList));
    }
    setLoading(false);
  }, [
    can,
    isDiscardedView,
    page,
    searchQuery,
    setLoading,
    sortBy,
    sortOrder,
    t,
  ]);

  useEffect(() => {
    if (permissionsLoading) return;
    const timeoutId = window.setTimeout(() => {
      void loadCampuses();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCampuses, permissionsLoading]);

  const columns = useMemo<IAdminTableColumn<IAdminCampus>[]>(
    () => [
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.IMAGE,
        header: t(AppLocales.Admin.Campuses.Table.Image),
        className: "w-16",
        render: (campus) => {
          const image = unwrapNested(campus.image);
          return (
            <div className="h-12 w-12 overflow-hidden rounded-lg border border-base-300 bg-base-200">
              <Image
                src={image?.url || ""}
                alt={campus.name}
                className="h-full w-full object-cover"
              />
            </div>
          );
        },
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.NAME,
        header: t(AppLocales.Admin.Campuses.Table.Name),
        sortKey: ADMIN_CAMPUS_SORT_KEYS.NAME,
        render: (campus) => (
          <div>
            <div className="font-semibold text-base-content">{campus.name}</div>
            {campus.code ? (
              <div className="text-caption text-base-content/60 font-mono text-xs">
                {campus.code}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.PHONE,
        header: t(AppLocales.Admin.Campuses.Table.Phone),
        render: (campus) => campus.phone || "—",
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.LOCATION,
        header: t(AppLocales.Admin.Campuses.Table.Location),
        render: (campus) => (
          <div className="max-w-xs truncate text-caption text-base-content/80">
            {campus.location || "—"}
          </div>
        ),
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.STATUS,
        header: t(AppLocales.Admin.Campuses.Table.Status),
        sortKey: ADMIN_CAMPUS_SORT_KEYS.STATUS,
        className: "text-center",
        render: (campus) => <StatusBadge status={campus.status} />,
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.CLASSES,
        header: t(AppLocales.Admin.Campuses.Table.Classes),
        className: "text-center",
        render: (campus) => campus.school_classes_count ?? 0,
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.TEACHERS,
        header: t(AppLocales.Admin.Campuses.Table.Teachers),
        className: "text-center",
        render: (campus) => campus.teachers_count ?? 0,
      },

      {
        key: ADMIN_CAMPUS_TABLE_KEYS.LIFECYCLE_DATE,
        header: isDiscardedView
          ? t(AppLocales.Admin.Common.Table.DiscardedAt)
          : t(AppLocales.Admin.Common.Table.CreatedAt),
        sortKey: isDiscardedView
          ? ADMIN_CAMPUS_SORT_KEYS.DISCARDED_AT
          : ADMIN_CAMPUS_SORT_KEYS.CREATED_AT,
        className: "text-center",
        render: (campus) => (
          <DateTime
            value={
              isDiscardedView ? campus.discarded_at : campus.created_at
            }
            format={DateTimeFormats.ADMIN}
          />
        ),
      },
      {
        key: ADMIN_CAMPUS_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (campus) => (
          <AdminTableActions
            resource={ADMIN_RESOURCES.CAMPUSES}
            actions={
              isDiscardedView
                ? [
                    {
                      type: ADMIN_ACTIONS.UNDISCARD,
                      onClick: () => setLifecycleTarget(campus),
                    },
                  ]
                : [
                    {
                      type: ADMIN_ACTIONS.EDIT,
                      onClick: () =>
                        navigate(
                          AppRoutes.withId(
                            AppRoutes.client.protected.admin.CAMPUS_EDIT,
                            campus.id,
                          ),
                        ),
                    },
                    {
                      type: ADMIN_ACTIONS.DISCARD,
                      onClick: () => setLifecycleTarget(campus),
                    },
                  ]
            }
          />
        ),
      },
    ],
    [isDiscardedView, navigate, t],
  );

  const handleLifecycle = async () => {
    if (!lifecycleTarget) return;
    setLoading(true);
    const result = isDiscardedView
      ? await CampusController.undiscardCampus(lifecycleTarget.id)
      : await CampusController.discardCampus(lifecycleTarget.id);
    setLoading(false);

    if (result.success) {
      toast.success(
        result.message ||
          (isDiscardedView
            ? t(AppLocales.Admin.Campuses.Toasts.RestoreSuccess)
            : t(AppLocales.Admin.Campuses.Toasts.DeleteSuccess)),
      );
      setLifecycleTarget(null);
      void loadCampuses();
    } else {
      toast.error(
        result.error ||
          (isDiscardedView
            ? t(AppLocales.Admin.Campuses.Errors.Restore)
            : t(AppLocales.Admin.Campuses.Errors.Delete)),
      );
    }
  };

  const canCreate = can(ADMIN_ACTIONS.CREATE, ADMIN_RESOURCES.CAMPUSES);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isDiscardedView
            ? t(AppLocales.Admin.Campuses.RecycleTitle)
            : t(AppLocales.Admin.Campuses.Title)
        }
        description={
          isDiscardedView
            ? t(AppLocales.Admin.Campuses.RecycleDescription)
            : t(AppLocales.Admin.Campuses.Description)
        }
        action={
          !isDiscardedView && canCreate ? (
            <Button
              onClick={() =>
                navigate(AppRoutes.client.protected.admin.CAMPUS_CREATE)
              }
            >
              <iconsLib.plus className="mr-2 h-4 w-4" />
              {t(AppLocales.Admin.Campuses.CreateButton)}
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={view}
            onChange={(tab) => {
              updateFilters({
                discarded: tab === ADMIN_VIEW_MODES.DISCARDED,
                page: 1,
              });
            }}
            items={[
              {
                value: ADMIN_VIEW_MODES.ACTIVE,
                label: t(AppLocales.Admin.Campuses.Tabs.Active),
                icon: iconsLib.home,
                count:
                  view === ADMIN_VIEW_MODES.ACTIVE
                    ? pagination?.total_count
                    : undefined,
              },
              {
                value: ADMIN_VIEW_MODES.DISCARDED,
                label: t(AppLocales.Admin.Campuses.Tabs.RecycleBin),
                icon: iconsLib.trash,
                count:
                  view === ADMIN_VIEW_MODES.DISCARDED
                    ? pagination?.total_count
                    : undefined,
              },
            ]}
          />
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder={t(AppLocales.Admin.Campuses.SearchPlaceholder)}
              searchableKeys={[
                t(AppLocales.Admin.Campuses.Table.Name),
                t(AppLocales.Admin.Campuses.Table.Code),
              ]}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
            />
          </div>
        </div>
      </PageHeader>

      {error ? (
        <AdminState
          icon={iconsLib.warning}
          title={t(AppLocales.Admin.Common.State.ErrorTitle)}
          message={error}
        />
      ) : !isLoading && campuses.length === 0 ? (
        <AdminState
          icon={iconsLib.home}
          title={t(AppLocales.Admin.Common.State.EmptyTitle)}
          message={
            isDiscardedView
              ? t(AppLocales.Admin.Campuses.RecycleEmpty)
              : t(AppLocales.Admin.Campuses.Empty)
          }
        />
      ) : (
        <>
          <AdminTable
            columns={columns}
            records={campuses}
            getRowKey={(campus) => campus.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(campus) =>
              navigate(
                AppRoutes.withId(
                  AppRoutes.client.protected.admin.CAMPUS_DETAIL,
                  campus.id,
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

      <ConfirmDialog
        isOpen={Boolean(lifecycleTarget)}
        title={
          isDiscardedView
            ? t(AppLocales.Admin.Campuses.Confirm.RestoreTitle)
            : t(AppLocales.Admin.Campuses.Confirm.DeleteTitle)
        }
        message={
          isDiscardedView
            ? t(AppLocales.Admin.Campuses.Confirm.RestoreMessage)
            : t(AppLocales.Admin.Campuses.Confirm.DeleteMessage)
        }
        confirmLabel={
          isDiscardedView
            ? t(AppLocales.Admin.Common.Actions.Restore)
            : t(AppLocales.Admin.Common.Actions.Discard)
        }
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive={!isDiscardedView}
        isLoading={isLoading}
        onClose={() => setLifecycleTarget(null)}
        onConfirm={handleLifecycle}
      />
    </div>
  );
};
