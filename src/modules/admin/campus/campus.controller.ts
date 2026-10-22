import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import CampusService from "./campus.service";
import type {
  IAdminCampus,
  IAdminCampusFormValues,
  IAdminCampusListParams,
  IAdminCampusStudentsParams,
  IAdminClassEnrollment,
} from "./types";

class CampusController {
  async getCampuses(params?: IAdminCampusListParams): Promise<{
    success: boolean;
    campuses: IAdminCampus[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await CampusService.getCampuses(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } = parsePagyList<IAdminCampus>(response);
      return { success: true, campuses: records, pagination };
    }

    return {
      success: false,
      campuses: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadList),
      ),
    };
  }

  async getCampus(id: string): Promise<{
    success: boolean;
    campus?: IAdminCampus;
    error?: string;
  }> {
    const response = await CampusService.getCampus(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return { success: true, campus: parseRecord<IAdminCampus>(data) };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadOne),
      ),
    };
  }

  async createCampus(values: IAdminCampusFormValues): Promise<{
    success: boolean;
    campus?: IAdminCampus;
    message?: string;
    error?: string;
  }> {
    const response = await CampusService.createCampus(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        campus: parseRecord<IAdminCampus>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.Create),
      ),
    };
  }

  async updateCampus(
    id: string,
    values: IAdminCampusFormValues,
  ): Promise<{
    success: boolean;
    campus?: IAdminCampus;
    message?: string;
    error?: string;
  }> {
    const response = await CampusService.updateCampus(id, values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        campus: parseRecord<IAdminCampus>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.Update),
      ),
    };
  }

  async discardCampus(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await CampusService.discardCampus(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.Delete),
      ),
    };
  }

  async undiscardCampus(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await CampusService.undiscardCampus(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.Restore),
      ),
    };
  }

  async getCampusStudents(
    campusId: string,
    params?: IAdminCampusStudentsParams,
  ): Promise<{
    success: boolean;
    enrollments: IAdminClassEnrollment[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await CampusService.getCampusStudents(campusId, params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminClassEnrollment>(response);
      return { success: true, enrollments: records, pagination };
    }

    return {
      success: false,
      enrollments: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadStudents),
      ),
    };
  }
}

export default new CampusController();
