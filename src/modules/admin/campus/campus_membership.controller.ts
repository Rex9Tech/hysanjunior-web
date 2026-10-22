import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import CampusMembershipService from "./campus_membership.service";
import type {
  IAdminCampusMembership,
  IAdminCampusMembershipFormValues,
  IAdminCampusMembershipListParams,
} from "./types";

class CampusMembershipController {
  async getMemberships(params?: IAdminCampusMembershipListParams): Promise<{
    success: boolean;
    memberships: IAdminCampusMembership[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await CampusMembershipService.getMemberships(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminCampusMembership>(response);
      return { success: true, memberships: records, pagination };
    }

    return {
      success: false,
      memberships: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadTeachers),
      ),
    };
  }

  async getMembership(id: string): Promise<{
    success: boolean;
    membership?: IAdminCampusMembership;
    error?: string;
  }> {
    const response = await CampusMembershipService.getMembership(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        membership: parseRecord<IAdminCampusMembership>(data),
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadTeachers),
      ),
    };
  }

  async createMembership(values: IAdminCampusMembershipFormValues): Promise<{
    success: boolean;
    membership?: IAdminCampusMembership;
    message?: string;
    error?: string;
  }> {
    const response = await CampusMembershipService.createMembership(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        membership: parseRecord<IAdminCampusMembership>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.AddTeacher),
      ),
    };
  }

  async discardMembership(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await CampusMembershipService.discardMembership(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.RemoveTeacher),
      ),
    };
  }
}

export default new CampusMembershipController();
