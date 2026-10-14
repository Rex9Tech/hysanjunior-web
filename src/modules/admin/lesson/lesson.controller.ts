import type { IApiPagination, IJsonApiResource } from "../../../models";
import { AppLocales, translate } from "../../../locales";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import { parseLessonRecord } from "./lesson.helpers";
import LessonService from "./lesson.service";
import type {
  IAdminLesson,
  IAdminLessonAiQueueResult,
  IAdminLessonListParams,
  IAdminLessonMediaFiles,
  IAdminLessonWritePayload,
} from "./types";

class LessonController {
  async getLessons(params?: IAdminLessonListParams): Promise<{
    success: boolean;
    lessons: IAdminLesson[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await LessonService.getLessons(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } = parsePagyList<IAdminLesson>(response);
      return {
        success: true,
        lessons: records.map((record) => parseLessonRecord(record)),
        pagination,
      };
    }

    return {
      success: false,
      lessons: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.LoadList),
      ),
    };
  }

  async getLesson(id: string): Promise<{
    success: boolean;
    lesson?: IAdminLesson;
    error?: string;
  }> {
    const response = await LessonService.getLesson(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        lesson: parseLessonRecord(
          data as IJsonApiResource<IAdminLesson> | IAdminLesson,
        ),
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.LoadOne),
      ),
    };
  }

  async createLesson(
    payload: IAdminLessonWritePayload,
    media?: IAdminLessonMediaFiles,
  ): Promise<{
    success: boolean;
    lesson?: IAdminLesson;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.createLesson(payload, media);
    const { status, data } = response.data || {};

    if (status?.success) {
      return {
        success: true,
        lesson: data
          ? parseLessonRecord(
              data as IJsonApiResource<IAdminLesson> | IAdminLesson,
            )
          : undefined,
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.Create),
      ),
    };
  }

  async updateLesson(
    id: string,
    payload: IAdminLessonWritePayload,
    media?: IAdminLessonMediaFiles,
  ): Promise<{
    success: boolean;
    lesson?: IAdminLesson;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.updateLesson(id, payload, media);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        lesson: parseLessonRecord(
          data as IJsonApiResource<IAdminLesson> | IAdminLesson,
        ),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.Update),
      ),
    };
  }

  async discardLesson(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.discardLesson(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.Delete),
      ),
    };
  }

  async undiscardLesson(id: string): Promise<{
    success: boolean;
    lesson?: IAdminLesson;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.undiscardLesson(id);
    const { status, data } = response.data || {};

    if (status?.success) {
      return {
        success: true,
        lesson: data
          ? parseLessonRecord(
              data as IJsonApiResource<IAdminLesson> | IAdminLesson,
            )
          : undefined,
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.Restore),
      ),
    };
  }

  async createWordFamilies(id: string): Promise<{
    success: boolean;
    result?: IAdminLessonAiQueueResult;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.createWordFamilies(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        result: parseRecord<IAdminLessonAiQueueResult>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.AiQueue),
      ),
    };
  }

  async createStoryOrder(id: string): Promise<{
    success: boolean;
    result?: IAdminLessonAiQueueResult;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.createStoryOrder(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        result: parseRecord<IAdminLessonAiQueueResult>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.AiQueue),
      ),
    };
  }

  async createBuildTheSentences(id: string): Promise<{
    success: boolean;
    result?: IAdminLessonAiQueueResult;
    message?: string;
    error?: string;
  }> {
    const response = await LessonService.createBuildTheSentences(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        result: parseRecord<IAdminLessonAiQueueResult>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Lessons.Errors.AiQueue),
      ),
    };
  }
}

export default new LessonController();
