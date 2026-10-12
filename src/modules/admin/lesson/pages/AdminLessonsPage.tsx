import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DateTime,
  DateTimeFormats,
  SearchInput,
} from "../../../../design";
import {
  ButtonSizes,
  ButtonVariants,
} from "../../../../design/constants";
import { useDocumentTitle, useSort, SORT_ORDERS } from "../../../../hooks";
import type { IApiPagination } from "../../../../models";
import { AppLocales, useTranslate } from "../../../../locales";
import { useToast } from "../../../../contexts/ToastContext";
import {
  AdminPagination,
  AdminState,
  AdminTable,
  ConfirmDialog,
  PageHeader,
  type IAdminTableColumn,
} from "../../components";
import { ADMIN_PAGE_SIZE } from "../../constants";
import {
  ADMIN_LESSON_SORT_KEYS,
  ADMIN_LESSON_TABLE_KEYS,
} from "../constants";
import { deleteLesson, listLessons } from "../lesson.mock.store";
import type { IAdminLesson, IAdminLessonFilters } from "../types";
import { AdminLessonAssignHomeworkDialog } from "./AdminLessonAssignHomeworkDialog";
import { AdminLessonFilterDialog } from "./AdminLessonFilterDialog";

export const AdminLessonsPage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Lessons.Title)} | Admin`);

  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const levelFilter = searchParams.get("level") || "";
  const unitFilter = searchParams.get("unit") || "";
  const fromFilter = searchParams.get("from") || "";
  const toFilter = searchParams.get("to") || "";

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IAdminLesson | null>(null);
  const [homeworkTarget, setHomeworkTarget] = useState<IAdminLesson | null>(
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
      level: levelFilter,
      unit: unitFilter,
      from: fromFilter,
      to: toFilter,
    }),
    [levelFilter, unitFilter, fromFilter, toFilter],
  );

  const hasActiveFilters = Boolean(
    levelFilter || unitFilter || fromFilter || toFilter,
  );

  const updateFilters = useCallback(
    (updates: {
      page?: number;
      search?: string;
      level?: string;
      unit?: string;
      from?: string;
      to?: string;
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
          if (updates.level !== undefined) {
            if (updates.level) next.set("level", updates.level);
            else next.delete("level");
          }
          if (updates.unit !== undefined) {
            if (updates.unit) next.set("unit", updates.unit);
            else next.delete("unit");
          }
          if (updates.from !== undefined) {
            if (updates.from) next.set("from", updates.from);
            else next.delete("from");
          }
          if (updates.to !== undefined) {
            if (updates.to) next.set("to", updates.to);
            else next.delete("to");
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

  const loadLessons = useCallback(() => {
    const result = listLessons({
      page,
      limit: ADMIN_PAGE_SIZE,
      search: searchQuery,
      level: levelFilter,
      unit: unitFilter,
      from: fromFilter,
      to: toFilter,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    setLessons(result.lessons);
    setPagination(result.pagination);
  }, [
    page,
    searchQuery,
    levelFilter,
    unitFilter,
    fromFilter,
    toFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadLessons(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLessons]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ok = deleteLesson(deleteTarget.id);
    setDeleteTarget(null);
    if (ok) {
      toast.success(t(AppLocales.Admin.Lessons.Toasts.DeleteSuccess));
      loadLessons();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.Errors.Delete));
    }
  };

  const columns = useMemo<IAdminTableColumn<IAdminLesson>[]>(
    () => [
      {
        key: ADMIN_LESSON_TABLE_KEYS.THUMBNAIL,
        header: t(AppLocales.Admin.Lessons.Table.Thumbnail),
        render: (lesson) =>
          lesson.thumbnailUrl ? (
            <img
              src={lesson.thumbnailUrl}
              alt=""
              className="h-12 w-16 rounded-md object-cover bg-base-200"
            />
          ) : (
            <div className="flex h-12 w-16 items-center justify-center rounded-md bg-base-200 text-base-content/40">
              <iconsLib.photo className="h-5 w-5" />
            </div>
          ),
      },
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
        render: (lesson) => lesson.level,
      },
      {
        key: ADMIN_LESSON_TABLE_KEYS.CREATED_AT,
        header: t(AppLocales.Admin.Lessons.Table.Created),
        sortKey: ADMIN_LESSON_SORT_KEYS.CREATED_AT,
        render: (lesson) => (
          <DateTime value={lesson.createdAt} format={DateTimeFormats.ADMIN} />
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
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-base-300 bg-base-100 text-base-content/70 hover:text-base-content hover:bg-base-200"
              aria-label={t(AppLocales.Admin.Lessons.AssignHomework.Button)}
              title={t(AppLocales.Admin.Lessons.AssignHomework.Button)}
              onClick={() => setHomeworkTarget(lesson)}
            >
              <iconsLib.inboxStack className="h-4 w-4" />
            </Button>
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
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-error/30 bg-error/5 text-error hover:bg-error/15"
              aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
              title={t(AppLocales.Admin.Common.Actions.Destroy)}
              onClick={() => setDeleteTarget(lesson)}
            >
              <iconsLib.trash className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(AppLocales.Admin.Lessons.Title)}
        description={t(AppLocales.Admin.Lessons.Description)}
        action={
          <Button
            onClick={() =>
              navigate(AppRoutes.client.protected.admin.LESSON_CREATE)
            }
          >
            <iconsLib.plus className="mr-2 h-4 w-4 text-secondary-content" />
            {t(AppLocales.Admin.Lessons.CreateButton)}
          </Button>
        }
      >
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
        </div>
      </PageHeader>

      {lessons.length === 0 ? (
        <AdminState
          title={t(AppLocales.Admin.Lessons.Title)}
          message={t(AppLocales.Admin.Lessons.Empty)}
        />
      ) : (
        <div className="rounded-box border border-base-content/10 shadow-sm">
          <AdminTable
            columns={columns}
            records={lessons}
            getRowKey={(lesson) => lesson.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
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
            level: "",
            unit: "",
            from: "",
            to: "",
            page: 1,
          });
          setIsFilterOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t(AppLocales.Admin.Lessons.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <AdminLessonAssignHomeworkDialog
        lesson={homeworkTarget}
        isOpen={Boolean(homeworkTarget)}
        onClose={() => setHomeworkTarget(null)}
        onSaved={loadLessons}
      />
    </div>
  );
};
