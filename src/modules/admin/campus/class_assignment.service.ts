import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminClassAssignment,
  IAdminClassAssignmentFormValues,
  IAdminClassAssignmentListParams,
} from "./types";

class ClassAssignmentService {
  async getAssignments(
    params?: IAdminClassAssignmentListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassAssignment>[]>>
  > {
    return api.get<IJsonApiResource<IAdminClassAssignment>[]>(
      AppRoutes.server.protected.admin.CLASS_ASSIGNMENTS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            school_class_id: params.school_class_id,
            campus_id: params.campus_id,
            user_id: params.user_id,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async createAssignment(
    values: IAdminClassAssignmentFormValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassAssignment>>>
  > {
    return api.post<IJsonApiResource<IAdminClassAssignment>>(
      AppRoutes.server.protected.admin.CLASS_ASSIGNMENTS,
      { class_assignment: values },
    );
  }

  async discardAssignment(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_ASSIGNMENT_DETAIL,
        id,
      ),
    );
  }
}

export default new ClassAssignmentService();
