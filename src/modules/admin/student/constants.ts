import AppRoutes from "../../../AppRoutes";
import { ADMIN_RESOURCES, IAdminPageMeta } from "../constants";

export const ADMIN_STUDENT_ROLE_NAMES = {
  STUDENT: "student",
  PARENT: "parent",
} as const;

export const ADMIN_STUDENT_TABLE_KEYS = {
  STUDENT: "student",
  CAMPUS: "campus",
  CLASS: "class",
  LEVEL: "level",
  STATUS: "status",
  PARENTS: "parents",
  ACTIONS: "actions",
} as const;

export const ADMIN_STUDENT_SORT_KEYS = {
  CREATED_AT: "created_at",
  STATUS: "status",
} as const;

export const ADMIN_STUDENT_PAGE_META: Record<string, IAdminPageMeta> = {
  [AppRoutes.client.protected.admin.STUDENTS]: {
    title: "Students",
    actionLabel: "Create student",
    actionTo: AppRoutes.client.protected.admin.STUDENT_CREATE,
    actionResource: ADMIN_RESOURCES.CLASS_ENROLLMENTS,
  },
  [AppRoutes.client.protected.admin.STUDENT_CREATE]: {
    title: "Create Student",
    description:
      "Create a student, place them in a class, and optionally link a parent.",
  },
  [AppRoutes.client.protected.admin.STUDENT_DETAIL]: {
    title: "Student",
    description: "Enrollment, class placement, and parent links.",
  },
};
