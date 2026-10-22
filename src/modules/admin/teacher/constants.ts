import AppRoutes from "../../../AppRoutes";
import { ADMIN_RESOURCES, IAdminPageMeta } from "../constants";

export const ADMIN_TEACHER_ROLE_NAMES = {
  TEACHER_ADMIN: "teacher_admin",
} as const;

export const ADMIN_TEACHER_TABLE_KEYS = {
  TEACHER: "teacher",
  CAMPUS: "campus",
  KIND: "kind",
  CREATED: "created",
  ACTIONS: "actions",
} as const;

export const ADMIN_TEACHER_SORT_KEYS = {
  CREATED_AT: "created_at",
  KIND: "kind",
} as const;

export const ADMIN_TEACHER_PAGE_META: Record<string, IAdminPageMeta> = {
  [AppRoutes.client.protected.admin.TEACHERS]: {
    title: "Teachers",
    actionLabel: "Create teacher",
    actionTo: AppRoutes.client.protected.admin.TEACHER_CREATE,
    actionResource: ADMIN_RESOURCES.CAMPUS_MEMBERSHIPS,
  },
  [AppRoutes.client.protected.admin.TEACHER_CREATE]: {
    title: "Create Teacher",
    description:
      "Create a teacher, attach them to a campus, and optionally assign a class.",
  },
  [AppRoutes.client.protected.admin.TEACHER_DETAIL]: {
    title: "Teacher",
    description: "Campus membership and class assignments.",
  },
};
