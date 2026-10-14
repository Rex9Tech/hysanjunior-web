import { SOCKET_MESSAGE_TYPES } from "./socket.helpers";
import type { ISocketMessage } from "../services/socket.service";
import { NOTIFICATION_SOCKET_TYPES } from "../modules/notification/constants";
import type {
  ILessonAiSocketData,
  TLessonAiSocketType,
} from "../modules/admin/lesson/types";

const LESSON_AI_SOCKET_TYPES = new Set<string>([
  NOTIFICATION_SOCKET_TYPES.LESSON_WORD_FAMILIES_GENERATED,
  NOTIFICATION_SOCKET_TYPES.LESSON_WORD_FAMILIES_FAILED,
  NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_GENERATED,
  NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_FAILED,
  NOTIFICATION_SOCKET_TYPES.LESSON_BUILD_THE_SENTENCES_GENERATED,
  NOTIFICATION_SOCKET_TYPES.LESSON_BUILD_THE_SENTENCES_FAILED,
]);

export const parseLessonAiSocketMessage = (
  message: ISocketMessage,
  lessonId: string,
): ILessonAiSocketData | null => {
  if (
    message.type &&
    message.type !== SOCKET_MESSAGE_TYPES.NOTIFICATION
  ) {
    return null;
  }

  const data = message.data;
  if (!data || typeof data !== "object") return null;

  const type = typeof data.type === "string" ? data.type : "";
  if (!LESSON_AI_SOCKET_TYPES.has(type)) return null;

  const eventLessonId =
    typeof data.lesson_id === "string" ? data.lesson_id : "";
  if (!eventLessonId || eventLessonId !== lessonId) return null;

  return {
    ...(data as ILessonAiSocketData),
    type: type as TLessonAiSocketType,
    lesson_id: eventLessonId,
  };
};

const previewStorageKey = (lessonId: string, kind: string) =>
  `admin.lesson.ai_preview.${kind}.${lessonId}`;

export const readLessonAiPreview = <T,>(
  lessonId: string,
  kind: string,
): T | null => {
  try {
    const raw = sessionStorage.getItem(previewStorageKey(lessonId, kind));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeLessonAiPreview = (
  lessonId: string,
  kind: string,
  value: unknown,
): void => {
  try {
    sessionStorage.setItem(
      previewStorageKey(lessonId, kind),
      JSON.stringify(value),
    );
  } catch {
    // ignore quota / private mode
  }
};

export const clearLessonAiPreview = (lessonId: string, kind: string): void => {
  try {
    sessionStorage.removeItem(previewStorageKey(lessonId, kind));
  } catch {
    // ignore
  }
};

export const LESSON_AI_PREVIEW_KINDS = {
  STORY_ORDER: "story_order",
  WORD_FAMILIES: "word_families",
  BUILD_THE_SENTENCES: "build_the_sentences",
} as const;
