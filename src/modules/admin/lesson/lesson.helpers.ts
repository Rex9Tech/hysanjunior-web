import type { IJsonApiResource } from "../../../models";
import { parseRecord } from "../../../services/api.service";
import type {
  IAdminLesson,
  IAdminLessonMediaFiles,
  IAdminLessonWritePayload,
} from "./types";

const isJsonApiNode = (
  value: unknown,
): value is IJsonApiResource<Record<string, unknown>> =>
  Boolean(
    value &&
      typeof value === "object" &&
      "attributes" in value &&
      "type" in value &&
      typeof (value as IJsonApiResource<Record<string, unknown>>).attributes ===
        "object" &&
      (value as IJsonApiResource<Record<string, unknown>>).attributes !== null,
  );

export const flattenLessonNested = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => flattenLessonNested(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (isJsonApiNode(value)) {
    const flat = parseRecord(value) as Record<string, unknown>;
    return flattenLessonNested(flat);
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    result[key] = flattenLessonNested(nested);
  }
  return result;
};

export const parseLessonRecord = (
  data: IJsonApiResource<IAdminLesson> | IAdminLesson,
): IAdminLesson => {
  const flat = parseRecord<IAdminLesson>(data);
  return flattenLessonNested(flat) as IAdminLesson;
};

const appendFormValue = (
  formData: FormData,
  path: string,
  value: unknown,
): void => {
  if (value === undefined) return;

  if (value === null) {
    formData.append(path, "");
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      formData.append(`${path}[]`, "");
      return;
    }
    value.forEach((item, index) => {
      if (item && typeof item === "object") {
        Object.entries(item as Record<string, unknown>).forEach(
          ([childKey, childValue]) => {
            appendFormValue(formData, `${path}[${index}][${childKey}]`, childValue);
          },
        );
        return;
      }
      formData.append(`${path}[]`, String(item));
    });
    return;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    formData.append(path, String(value));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(
      ([childKey, childValue]) => {
        appendFormValue(formData, `${path}[${childKey}]`, childValue);
      },
    );
    return;
  }

  formData.append(path, String(value));
};

export const buildLessonFormData = (
  payload: IAdminLessonWritePayload,
  media?: IAdminLessonMediaFiles,
): FormData => {
  const formData = new FormData();

  const entries = Object.entries(payload).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    // Core always params.require(:lesson). Media-only updates need the nested
    // key present; an unpermitted placeholder yields empty attributes.
    formData.append("lesson[_]", "");
  } else {
    entries.forEach(([key, value]) => {
      appendFormValue(formData, `lesson[${key}]`, value);
    });
  }

  if (media?.audio) formData.append("audio", media.audio);
  if (media?.srt) formData.append("srt", media.srt);
  if (media?.video) formData.append("video", media.video);
  if (media?.video_srt) formData.append("video_srt", media.video_srt);
  if (media?.thumbnail) formData.append("thumbnail", media.thumbnail);

  return formData;
};

export const hasLessonMediaFiles = (
  media?: IAdminLessonMediaFiles,
): boolean =>
  Boolean(
    media?.audio ||
      media?.srt ||
      media?.video ||
      media?.video_srt ||
      media?.thumbnail,
  );
