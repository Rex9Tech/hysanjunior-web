import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DateTime,
  DateTimeFormats,
  SearchInput,
  StatusBadge,
} from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle, useSort, SORT_ORDERS } from "../../../../hooks";
import type { IApiPagination } from "../../../../models";
import { AppLocales, useTranslate } from "../../../../locales";
import { Admin } from "../..";
import {
  AdminPagination,
  AdminState,
  AdminTable,
  ConfirmDialog,
  PageHeader,
  Tabs,
  type IAdminTableColumn,
} from "../../components";
import {
  ADMIN_PAGE_SIZE,
  ADMIN_VIEW_MODES,
  type TAdminViewMode,
} from "../../constants";
import {
  ADMIN_LESSON_SORT_KEYS,
  ADMIN_LESSON_TABLE_KEYS,
} from "../constants";
import type { IAdminLesson, IAdminLessonFilters } from "../types";
import { AdminLessonFilterDialog } from "./AdminLessonFilterDialog";

export const AdminLessonsPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const view: TAdminViewMode =
    searchParams.get("discarded") === "true"
      ? ADMIN_VIEW_MODES.DISCARDED
      : ADMIN_VIEW_MODES.ACTIVE;
  const isDiscardedView = view === ADMIN_VIEW_MODES.DISCARDED;

  useDocumentTitle(
    `${
      isDiscardedView
        ? t(AppLocales.Admin.Lessons.RecycleTitle)
        : t(AppLocales.Admin.Lessons.Title)
    } | Admin`,
  );

  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";
  const levelFilter = searchParams.get("level") || "";
  const unitFilter = searchParams.get("unit") || "";

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [lifecycleTarget, setLifecycleTarget] = useState<IAdminLesson | null>(
    null,
  );
  const [lessons, setLessons] = useState<IAdminLesson[]>([]);
  const [pagination, setPagination] = useState<IApiPagination | null>(null);

  const { sortBy, sortOrder, handleSort } = useSort({
    defaultSortBy: ADMIN_LESSON_SORT_KEYS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
  });

  const filters = useMemo<IAdminLessonFilters>(
    () => ({
      status: statusFilter,
      level: levelFilter,
      unit: unitFilter,
    }),
    [statusFilter, levelFilter, unitFilter],
  );

  const hasActiveFilters = Boolean(statusFilter || levelFilter || unitFilter);

  const updateFilters = useCallback(
    (updates: {
      page?: number;
      search?: string;
      status?: string;
      level?: string;
      unit?: string;
      discarded?: boolean;
    }) => {
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
          if (updates.status !== undefined) {
            if (updates.status) next.set("status", updates.status);
            else next.delete("status");
          }
          if (updates.level !== undefined) {
            if (updates.level) next.set("level", updates.level);
            else next.delete("level");
          }
          if (updates.unit !== undefined) {
            if (updates.unit) next.set("unit", updates.unit);
            else next.delete("unit");
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
    const timeoutId = window.setTimeout(() => {
      if (searchInput === searchQuery) return;
      updateFilters({ search: searchInput, page: 1 });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery, updateFilters]);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    const result = await Admin.LessonController.getLessons({
      page,
      limit: ADMIN_PAGE_SIZE,
      search: searchQuery || undefined,
      status: isDiscardedView
        ? undefined
        : (statusFilter as IAdminLesson["status"] | "") || undefined,
      level: levelFilter || undefined,
      unit: unitFilter || undefined,
      discarded: isDiscardedView || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.LoadList));
      setLessons([]);
      setPagination(null);
      return;
    }
    setLessons(result.lessons);
    setPagination(result.pagination);
  }, [
    page,
    searchQuery,
    statusFilter,
    levelFilter,
    unitFilter,
    isDiscardedView,
    sortBy,
    sortOrder,
    setLoading,
    toast,
    t,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLessons(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLessons]);

  const handleLifecycle = async () => {
    if (!lifecycleTarget) return;
    const result = isDiscardedView
      ? await Admin.LessonController.undiscardLesson(lifecycleTarget.id)
      : await Admin.LessonController.discardLesson(lifecycleTarget.id);
    setLifecycleTarget(null);
    if (!result.success) {
      toast.error(
        result.error ||
          t(
            isDiscardedView
              ? AppLocales.Admin.Lessons.Errors.Restore
              : AppLocales.Admin.Lessons.Errors.Delete,
          ),
      );
      return;
    }
    toast.success(
      result.message ||
        t(
          isDiscardedView
            ? AppLocales.Admin.Lessons.Toasts.RestoreSuccess
            : AppLocales.Admin.Lessons.Toasts.DeleteSuccess,
        ),
    );
    void loadLessons();
  };

  const columns = useMemo<IAdminTableColumn<IAdminLesson>[]>(
    () => [
      {
        key: ADMIN_LESSON_TABLE_KEYS.TITLE,
        header: t(AppLocales.Admin.Lessons.Table.Title),
        sortKey: ADMIN_LESSON_SORT_KEYS.TITLE,
        render: (lesson) => (
          <span className="font-semibold text-base-content">{lesson.title}</span>
        ),
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.UNIT,
        header: t(AppLocales.Admin.Lessons.Table.Unit),
        sortKey: ADMIN_LESSON_SORT_KEYS.UNIT,
        render: (lesson) => lesson.unit,
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.LEVEL,
        header: t(AppLocales.Admin.Lessons.Table.Level),
        sortKey: ADMIN_LESSON_SORT_KEYS.LEVEL,
        render: (lesson) =>
          t(AppLocales.Admin.Lessons.Form.LevelOption, { level: lesson.level }),
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.STATUS,
        header: t(AppLocales.Admin.Lessons.Table.Status),
        sortKey: ADMIN_LESSON_SORT_KEYS.STATUS,
        render: (lesson) => (
          <StatusBadge
            status={lesson.status}
            label={t(AppLocales.Admin.Lessons.Status[lesson.status])}
          />
        ),
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.CREATED_AT,
        header: t(AppLocales.Admin.Lessons.Table.Created),
        sortKey: ADMIN_LESSON_SORT_KEYS.CREATED_AT,
        render: (lesson) => (
          <DateTime value={lesson.created_at} format={DateTimeFormats.ADMIN} />
        ),
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.ACTIONS,
        header: t(AppLocales.Admin.Common.Table.Actions),
        className: "text-right",
        render: (lesson) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
            data-row-click-ignore="true"
          >
            {!isDiscardedView ? (
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-base-300 bg-base-100 text-base-content/70 hover:text-base-content hover:bg-base-200"
                aria-label={t(AppLocales.Admin.Common.Actions.Edit)}
                title={t(AppLocales.Admin.Common.Actions.Edit)}
                onClick={() =>
                  navigate(
                    AppRoutes.withId(
                      AppRoutes.client.protected.admin.LESSON_EDIT,
                      lesson.id,
                    ),
                  )
                }
              >
                <iconsLib.pencilSquare className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              className={
                isDiscardedView
                  ? "h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15"
                  : "h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-error/30 bg-error/5 text-error hover:bg-error/15"
              }
              aria-label={
                isDiscardedView
                  ? t(AppLocales.Admin.Common.Actions.Restore)
                  : t(AppLocales.Admin.Common.Actions.Destroy)
              }
              title={
                isDiscardedView
                  ? t(AppLocales.Admin.Common.Actions.Restore)
                  : t(AppLocales.Admin.Common.Actions.Destroy)
              }
              onClick={() => setLifecycleTarget(lesson)}
            >
              {isDiscardedView ? (
                <iconsLib.arrowPath className="h-4 w-4" />
              ) : (
                <iconsLib.trash className="h-4 w-4" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [isDiscardedView, navigate, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isDiscardedView
            ? t(AppLocales.Admin.Lessons.RecycleTitle)
            : t(AppLocales.Admin.Lessons.Title)
        }
        description={
          isDiscardedView
            ? t(AppLocales.Admin.Lessons.RecycleDescription)
            : t(AppLocales.Admin.Lessons.Description)
        }
        action={
          !isDiscardedView ? (
            <Button
              onClick={() =>
                navigate(AppRoutes.client.protected.admin.LESSON_CREATE)
              }
            >
              <iconsLib.plus className="mr-2 h-4 w-4 text-secondary-content" />
              {t(AppLocales.Admin.Lessons.CreateButton)}
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
                status: "",
              });
            }}
            items={[
              {
                value: ADMIN_VIEW_MODES.ACTIVE,
                label: t(AppLocales.Admin.Lessons.Tabs.Active),
                icon: iconsLib.sparkles,
                count:
                  view === ADMIN_VIEW_MODES.ACTIVE
                    ? pagination?.total_count
                    : undefined,
              },
              {
                value: ADMIN_VIEW_MODES.DISCARDED,
                label: t(AppLocales.Admin.Lessons.Tabs.RecycleBin),
                icon: iconsLib.trash,
                count:
                  view === ADMIN_VIEW_MODES.DISCARDED
                    ? pagination?.total_count
                    : undefined,
              },
            ]}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onClear={() => setSearchInput("")}
                placeholder={t(AppLocales.Admin.Lessons.SearchPlaceholder)}
                searchableKeys={[t(AppLocales.Admin.Lessons.Table.Title)]}
              />
            </div>
            {!isDiscardedView ? (
              <Button
                variant={ButtonVariants.SECONDARY}
                onClick={() => setIsFilterOpen(true)}
              >
                <iconsLib.filter className="mr-2 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.FilterButton)}
                {hasActiveFilters ? (
                  <span className="ml-2 badge badge-primary badge-sm">•</span>
                ) : null}
              </Button>
            ) : null}
          </div>
        </div>
      </PageHeader>

      {lessons.length === 0 ? (
        <AdminState
          title={
            isDiscardedView
              ? t(AppLocales.Admin.Lessons.RecycleTitle)
              : t(AppLocales.Admin.Lessons.Title)
          }
          message={
            isDiscardedView
              ? t(AppLocales.Admin.Lessons.RecycleEmpty)
              : t(AppLocales.Admin.Lessons.Empty)
          }
        />
      ) : (
        <div className="rounded-box border border-base-content/10 shadow-sm bg-base-100">
          <AdminTable
            columns={columns}
            records={lessons}
            getRowKey={(lesson) => lesson.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={
              isDiscardedView
                ? undefined
                : (lesson) =>
                    navigate(
                      AppRoutes.withId(
                        AppRoutes.client.protected.admin.LESSON_EDIT,
                        lesson.id,
                      ),
                    )
            }
          />
          <div className="px-4 pb-4">
            <AdminPagination
              pagination={pagination}
              onPageChange={(nextPage) => updateFilters({ page: nextPage })}
            />
          </div>
        </div>
      )}

      <AdminLessonFilterDialog
        isOpen={isFilterOpen}
        initialFilters={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          updateFilters({ ...next, page: 1 });
        }}
        onReset={() => {
          updateFilters({
            status: "",
            level: "",
            unit: "",
            page: 1,
          });
          setIsFilterOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(lifecycleTarget)}
        title={
          isDiscardedView
            ? t(AppLocales.Admin.Lessons.Confirm.RestoreTitle)
            : t(AppLocales.Admin.Lessons.Confirm.DeleteTitle)
        }
        message={
          isDiscardedView
            ? t(AppLocales.Admin.Lessons.Confirm.RestoreMessage)
            : t(AppLocales.Admin.Lessons.Confirm.DeleteMessage)
        }
        confirmLabel={
          isDiscardedView
            ? t(AppLocales.Admin.Common.Actions.Restore)
            : t(AppLocales.Admin.Common.Actions.Discard)
        }
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive={!isDiscardedView}
        onConfirm={() => void handleLifecycle()}
        onClose={() => setLifecycleTarget(null)}
      />
    </div>
  );
};
