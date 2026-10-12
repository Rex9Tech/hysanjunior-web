export const StorageKeys = {
  LOCALE: "locale",
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
  MARKERS: "markers",
  START_TIME: "startTime",
  END_TIME: "endTime",
  CONTINUE_URL: "continueUrl",
  ADMIN_LESSONS: "adminLessons",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
