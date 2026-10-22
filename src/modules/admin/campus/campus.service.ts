import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminCampus,
  IAdminCampusFormValues,
  IAdminCampusListParams,
  IAdminCampusStudentsParams,
  IAdminClassEnrollment,
} from "./types";

class CampusService {
  async getCampuses(
    params?: IAdminCampusListParams,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampus>[]>>> {
    return api.get<IJsonApiResource<IAdminCampus>[]>(
      AppRoutes.server.protected.admin.CAMPUSES,
      params
        ? {
            page: params.page,
            limit: params.limit,
            search: params.search,
            status: params.status || undefined,
            discarded: params.discarded ? "true" : undefined,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getCampus(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampus>>>> {
    return api.get<IJsonApiResource<IAdminCampus>>(
      AppRoutes.withId(AppRoutes.server.protected.admin.CAMPUS_DETAIL, id),
    );
  }

  async createCampus(
    values: IAdminCampusFormValues,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampus>>>> {
    return api.post<IJsonApiResource<IAdminCampus>>(
      AppRoutes.server.protected.admin.CAMPUSES,
      { campus: values },
    );
  }

  async updateCampus(
    id: string,
    values: IAdminCampusFormValues,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampus>>>> {
    return api.put<IJsonApiResource<IAdminCampus>>(
      AppRoutes.withId(AppRoutes.server.protected.admin.CAMPUS_DETAIL, id),
      { campus: values },
    );
  }

  async discardCampus(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(AppRoutes.server.protected.admin.CAMPUS_DETAIL, id),
    );
  }

  async undiscardCampus(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampus>>>> {
    return api.post<IJsonApiResource<IAdminCampus>>(
      AppRoutes.withId(AppRoutes.server.protected.admin.CAMPUS_UNDISCARD, id),
    );
  }

  async getCampusStudents(
    campusId: string,
    params?: IAdminCampusStudentsParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminClassEnrollment>[]>>
  > {
    return api.get<IJsonApiResource<IAdminClassEnrollment>[]>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CAMPUS_STUDENTS,
        campusId,
      ),
      params
        ? {
            page: params.page,
            limit: params.limit,
            level: params.level || undefined,
            school_class_id: params.school_class_id || undefined,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }
}

export default new CampusService();
