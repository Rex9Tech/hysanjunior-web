import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminSchoolClass,
  IAdminSchoolClassFormValues,
  IAdminSchoolClassListParams,
} from "./types";

class SchoolClassService {
  async getSchoolClasses(
    params?: IAdminSchoolClassListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminSchoolClass>[]>>
  > {
    return api.get<IJsonApiResource<IAdminSchoolClass>[]>(
      AppRoutes.server.protected.admin.SCHOOL_CLASSES,
      params
        ? {
            page: params.page,
            limit: params.limit,
            campus_id: params.campus_id,
            level: params.level || undefined,
            status: params.status || undefined,
            search: params.search,
            discarded: params.discarded ? "true" : undefined,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getSchoolClass(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminSchoolClass>>>> {
    return api.get<IJsonApiResource<IAdminSchoolClass>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.SCHOOL_CLASS_DETAIL,
        id,
      ),
    );
  }

  async createSchoolClass(
    values: IAdminSchoolClassFormValues,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminSchoolClass>>>> {
    return api.post<IJsonApiResource<IAdminSchoolClass>>(
      AppRoutes.server.protected.admin.SCHOOL_CLASSES,
      { school_class: values },
    );
  }

  async updateSchoolClass(
    id: string,
    values: IAdminSchoolClassFormValues,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminSchoolClass>>>> {
    return api.put<IJsonApiResource<IAdminSchoolClass>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.SCHOOL_CLASS_DETAIL,
        id,
      ),
      { school_class: values },
    );
  }

  async discardSchoolClass(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.SCHOOL_CLASS_DETAIL,
        id,
      ),
    );
  }

  async undiscardSchoolClass(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<IJsonApiResource<IAdminSchoolClass>>>> {
    return api.post<IJsonApiResource<IAdminSchoolClass>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.SCHOOL_CLASS_UNDISCARD,
        id,
      ),
    );
  }
}

export default new SchoolClassService();
