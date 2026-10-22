import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminParentStudent,
  IAdminParentStudentFormValues,
  IAdminParentStudentListParams,
} from "./types";

class ParentStudentService {
  async getParentStudents(
    params?: IAdminParentStudentListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminParentStudent>[]>>
  > {
    return api.get<IJsonApiResource<IAdminParentStudent>[]>(
      AppRoutes.server.protected.admin.PARENT_STUDENTS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            parent_id: params.parent_id,
            student_id: params.student_id,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async createParentStudent(
    values: IAdminParentStudentFormValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminParentStudent>>>
  > {
    return api.post<IJsonApiResource<IAdminParentStudent>>(
      AppRoutes.server.protected.admin.PARENT_STUDENTS,
      { parent_student: values },
    );
  }

  async discardParentStudent(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.PARENT_STUDENT_DETAIL,
        id,
      ),
    );
  }
}

export default new ParentStudentService();
