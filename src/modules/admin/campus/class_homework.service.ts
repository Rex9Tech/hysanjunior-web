import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminClassHomework,
  IAdminClassHomeworkFormValues,
  IAdminClassHomeworkListParams,
  IAdminClassHomeworkUpdateValues,
} from "./types";

class ClassHomeworkService {
  async getHomeworks(
    params?: IAdminClassHomeworkListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassHomework>[]>>
  > {
    return api.get<IJsonApiResource<IAdminClassHomework>[]>(
      AppRoutes.server.protected.admin.CLASS_HOMEWORKS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            school_class_id: params.school_class_id,
            lesson_id: params.lesson_id,
            campus_id: params.campus_id,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getHomework(
    id: string,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassHomework>>>
  > {
    return api.get<IJsonApiResource<IAdminClassHomework>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_HOMEWORK_DETAIL,
        id,
      ),
    );
  }

  async createHomework(
    values: IAdminClassHomeworkFormValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassHomework>>>
  > {
    return api.post<IJsonApiResource<IAdminClassHomework>>(
      AppRoutes.server.protected.admin.CLASS_HOMEWORKS,
      { class_homework: values },
    );
  }

  async updateHomework(
    id: string,
    values: IAdminClassHomeworkUpdateValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassHomework>>>
  > {
    return api.put<IJsonApiResource<IAdminClassHomework>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_HOMEWORK_DETAIL,
        id,
      ),
      { class_homework: values },
    );
  }

  async discardHomework(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_HOMEWORK_DETAIL,
        id,
      ),
    );
  }
}

export default new ClassHomeworkService();
