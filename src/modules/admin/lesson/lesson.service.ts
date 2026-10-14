import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import {
  buildLessonFormData,
  hasLessonMediaFiles,
} from "./lesson.helpers";
import type {
  IAdminLesson,
  IAdminLessonAiQueueResult,
  IAdminLessonListParams,
  IAdminLessonMediaFiles,
  IAdminLessonWritePayload,
} from "./types";

export type AdminLessonResponse =
  | IJsonApiResource<IAdminLesson>
  | IAdminLesson;

class LessonService {
  async getLessons(
    params?: IAdminLessonListParams,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminLesson>[]>>> {
    return api.get<IJsonApiResource<IAdminLesson>[]>(
      AppRoutes.server.protected.admin.LESSONS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            search: params.search,
            status: params.status || undefined,
            level: params.level || undefined,
            unit: params.unit || undefined,
            discarded: params.discarded ? "true" : undefined,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getLesson(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<AdminLessonResponse>>> {
    return api.get<AdminLessonResponse>(
      AppRoutes.withId(AppRoutes.server.protected.admin.LESSON_DETAIL, id),
    );
  }

  async createLesson(
    payload: IAdminLessonWritePayload,
    media?: IAdminLessonMediaFiles,
  ): Promise<IApiResponse<IApiEnvelope<AdminLessonResponse>>> {
    if (hasLessonMediaFiles(media)) {
      return api.post<AdminLessonResponse>(
        AppRoutes.server.protected.admin.LESSONS,
        buildLessonFormData(payload, media),
      );
    }

    return api.post<AdminLessonResponse>(
      AppRoutes.server.protected.admin.LESSONS,
      { lesson: payload },
    );
  }

  async updateLesson(
    id: string,
    payload: IAdminLessonWritePayload,
    media?: IAdminLessonMediaFiles,
  ): Promise<IApiResponse<IApiEnvelope<AdminLessonResponse>>> {
    const url = AppRoutes.withId(
      AppRoutes.server.protected.admin.LESSON_DETAIL,
      id,
    );

    if (hasLessonMediaFiles(media)) {
      return api.put<AdminLessonResponse>(
        url,
        buildLessonFormData(payload, media),
      );
    }

    return api.put<AdminLessonResponse>(url, { lesson: payload });
  }

  async discardLesson(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(AppRoutes.server.protected.admin.LESSON_DETAIL, id),
    );
  }

  async undiscardLesson(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<AdminLessonResponse>>> {
    return api.post<AdminLessonResponse>(
      AppRoutes.withId(AppRoutes.server.protected.admin.LESSON_UNDISCARD, id),
    );
  }

  async createWordFamilies(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IAdminLessonAiQueueResult>>> {
    return api.post<IAdminLessonAiQueueResult>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.LESSON_CREATE_WORD_FAMILIES,
        id,
      ),
    );
  }

  async createStoryOrder(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IAdminLessonAiQueueResult>>> {
    return api.post<IAdminLessonAiQueueResult>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.LESSON_CREATE_STORY_ORDER,
        id,
      ),
    );
  }

  async createBuildTheSentences(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IAdminLessonAiQueueResult>>> {
    return api.post<IAdminLessonAiQueueResult>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.LESSON_CREATE_BUILD_THE_SENTENCES,
        id,
      ),
    );
  }
}

export default new LessonService();
