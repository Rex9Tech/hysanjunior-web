import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminClassEnrollment,
  IAdminClassEnrollmentFormValues,
  IAdminClassEnrollmentListParams,
} from "./types";

class ClassEnrollmentService {
  async getEnrollments(
    params?: IAdminClassEnrollmentListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassEnrollment>[]>>
  > {
    return api.get<IJsonApiResource<IAdminClassEnrollment>[]>(
      AppRoutes.server.protected.admin.CLASS_ENROLLMENTS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            school_class_id: params.school_class_id,
            campus_id: params.campus_id,
            level: params.level || undefined,
            status: params.status || undefined,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getEnrollment(
    id: string,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassEnrollment>>>
  > {
    return api.get<IJsonApiResource<IAdminClassEnrollment>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_ENROLLMENT_DETAIL,
        id,
      ),
    );
  }

  async createEnrollment(
    values: IAdminClassEnrollmentFormValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassEnrollment>>>
  > {
    return api.post<IJsonApiResource<IAdminClassEnrollment>>(
      AppRoutes.server.protected.admin.CLASS_ENROLLMENTS,
      { class_enrollment: values },
    );
  }

  async updateEnrollment(
    id: string,
    values: Pick<IAdminClassEnrollmentFormValues, "school_class_id" | "status">,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassEnrollment>>>
  > {
    return api.put<IJsonApiResource<IAdminClassEnrollment>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_ENROLLMENT_DETAIL,
        id,
      ),
      { class_enrollment: values },
    );
  }

  async discardEnrollment(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CLASS_ENROLLMENT_DETAIL,
        id,
      ),
    );
  }
}

export default new ClassEnrollmentService();
