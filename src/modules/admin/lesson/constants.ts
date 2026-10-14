import { LESSON_STATUSES } from "./types";

export const ADMIN_LESSON_SORT_KEYS = {
  TITLE: "title",
  LEVEL: "level",
  UNIT: "unit",
  STATUS: "status",
  CREATED_AT: "created_at",
  DISCARDED_AT: "discarded_at",
} as const;

export const ADMIN_LESSON_TABLE_KEYS = {
  TITLE: "title",
  UNIT: "unit",
  LEVEL: "level",
  STATUS: "status",
  CREATED_AT: "created_at",
  ACTIONS: "actions",
} as const;

export const ADMIN_LESSON_LEVELS = [1, 2, 3, 4] as const;

export const ADMIN_LESSON_UNITS = [
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
] as const;

export const ADMIN_LESSON_STATUS_OPTIONS = [
  LESSON_STATUSES.DRAFT,
  LESSON_STATUSES.PUBLISHED,
  LESSON_STATUSES.UNPUBLISHED,
] as const;
