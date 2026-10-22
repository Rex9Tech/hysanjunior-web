import AppRoutes from "../../../AppRoutes";
import type {
  IApiEnvelope,
  IApiResponse,
  IJsonApiResource,
} from "../../../models";
import { api } from "../../../services";
import type {
  IAdminCampusMembership,
  IAdminCampusMembershipFormValues,
  IAdminCampusMembershipListParams,
} from "./types";

class CampusMembershipService {
  async getMemberships(
    params?: IAdminCampusMembershipListParams,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampusMembership>[]>>
  > {
    return api.get<IJsonApiResource<IAdminCampusMembership>[]>(
      AppRoutes.server.protected.admin.CAMPUS_MEMBERSHIPS,
      params
        ? {
            page: params.page,
            limit: params.limit,
            campus_id: params.campus_id,
            kind: params.kind,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    );
  }

  async getMembership(
    id: string,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampusMembership>>>
  > {
    return api.get<IJsonApiResource<IAdminCampusMembership>>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CAMPUS_MEMBERSHIP_DETAIL,
        id,
      ),
    );
  }

  async createMembership(
    values: IAdminCampusMembershipFormValues,
  ): Promise<
    IApiResponse<IApiEnvelope<IJsonApiResource<IAdminCampusMembership>>>
  > {
    return api.post<IJsonApiResource<IAdminCampusMembership>>(
      AppRoutes.server.protected.admin.CAMPUS_MEMBERSHIPS,
      { campus_membership: values },
    );
  }

  async discardMembership(
    id: string,
  ): Promise<IApiResponse<IApiEnvelope<null>>> {
    return api.delete<null>(
      AppRoutes.withId(
        AppRoutes.server.protected.admin.CAMPUS_MEMBERSHIP_DETAIL,
        id,
      ),
    );
  }
}

export default new CampusMembershipService();
