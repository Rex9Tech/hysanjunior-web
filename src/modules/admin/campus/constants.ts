import AppRoutes from "../../../AppRoutes";
import { ADMIN_RESOURCES, IAdminPageMeta } from "../constants";
import { CAMPUS_STATUSES, type TCampusDetailTab } from "./types";

export const ADMIN_CAMPUS_STATUS_OPTIONS = [
  CAMPUS_STATUSES.ACTIVE,
  CAMPUS_STATUSES.INACTIVE,
] as const;

export const ADMIN_CAMPUS_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const ADMIN_CAMPUS_DETAIL_TABS = {
  OVERVIEW: "overview",
  CLASSES: "classes",
  TEACHERS: "teachers",
  STUDENTS: "students",
} as const satisfies Record<string, TCampusDetailTab>;

export const ADMIN_CAMPUS_SORT_KEYS = {
  NAME: "name",
  CODE: "code",
  STATUS: "status",
  CREATED_AT: "created_at",
  DISCARDED_AT: "discarded_at",
} as const;

export const ADMIN_SCHOOL_CLASS_SORT_KEYS = {
  NAME: "name",
  LEVEL: "level",
  STATUS: "status",
  CREATED_AT: "created_at",
  DISCARDED_AT: "discarded_at",
} as const;

export const ADMIN_CAMPUS_TABLE_KEYS = {
  IMAGE: "image",
  NAME: "name",
  CODE: "code",
  PHONE: "phone",
  LOCATION: "location",
  STATUS: "status",
  CLASSES: "classes",
  TEACHERS: "teachers",
  LIFECYCLE_DATE: "lifecycle_date",
  ACTIONS: "actions",
} as const;

export const ADMIN_SCHOOL_CLASS_TABLE_KEYS = {
  NAME: "name",
  LEVEL: "level",
  STATUS: "status",
  STUDENTS: "students",
  TEACHERS: "teachers",
  ACTIONS: "actions",
} as const;

export const ADMIN_CAMPUS_MEMBERSHIP_TABLE_KEYS = {
  USER: "user",
  KIND: "kind",
  CREATED: "created",
  ACTIONS: "actions",
} as const;

export const ADMIN_CLASS_ASSIGNMENT_TABLE_KEYS = {
  TEACHER: "teacher",
  CREATED: "created",
  ACTIONS: "actions",
} as const;

export const ADMIN_CLASS_ENROLLMENT_TABLE_KEYS = {
  STUDENT: "student",
  CLASS: "class",
  LEVEL: "level",
  STATUS: "status",
  PARENTS: "parents",
  ACTIONS: "actions",
} as const;

export const ADMIN_HOMEWORK_ACTIVITY_KEYS = [
  "listen_and_tap",
  "speak_and_record",
  "trace_and_write",
  "blend_the_sound",
  "sort_the_word_families",
  "read_a_story",
  "sing_and_chant",
  "put_the_story_in_order",
  "build_the_sentences",
  "made_good_choice",
  "sort_healthy_choices",
] as const;

export const ADMIN_CLASS_HOMEWORK_TABLE_KEYS = {
  LESSON: "lesson",
  ACTIVITIES: "activities",
  INTROS: "intros",
  DUE: "due",
  ACTIONS: "actions",
} as const;


export const ADMIN_CAMPUS_USER_SEARCH_LIMIT = 10;
export const ADMIN_CAMPUS_USER_SEARCH_MIN_LENGTH = 2;

export const ADMIN_CAMPUS_PAGE_META: Record<string, IAdminPageMeta> = {
  [AppRoutes.client.protected.admin.CAMPUSES]: {
    title: "Campuses",
    actionLabel: "Create campus",
    actionTo: AppRoutes.client.protected.admin.CAMPUS_CREATE,
    actionResource: ADMIN_RESOURCES.CAMPUSES,
    hasRecycleBin: true,
  },
  [AppRoutes.client.protected.admin.CAMPUS_CREATE]: {
    title: "Create Campus",
    description: "Add a campus site for classes, teachers, and students.",
  },
  [AppRoutes.client.protected.admin.CAMPUS_EDIT]: {
    title: "Edit Campus",
    description: "Update campus name, code, and status.",
  },
};
