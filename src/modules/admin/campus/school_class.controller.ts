import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import SchoolClassService from "./school_class.service";
import type {
  IAdminSchoolClass,
  IAdminSchoolClassFormValues,
  IAdminSchoolClassListParams,
} from "./types";

class SchoolClassController {
  async getSchoolClasses(params?: IAdminSchoolClassListParams): Promise<{
    success: boolean;
    schoolClasses: IAdminSchoolClass[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await SchoolClassService.getSchoolClasses(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminSchoolClass>(response);
      return { success: true, schoolClasses: records, pagination };
    }

    return {
      success: false,
      schoolClasses: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadClasses),
      ),
    };
  }

  async getSchoolClass(id: string): Promise<{
    success: boolean;
    schoolClass?: IAdminSchoolClass;
    error?: string;
  }> {
    const response = await SchoolClassService.getSchoolClass(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        schoolClass: parseRecord<IAdminSchoolClass>(data),
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadClass),
      ),
    };
  }

  async createSchoolClass(values: IAdminSchoolClassFormValues): Promise<{
    success: boolean;
    schoolClass?: IAdminSchoolClass;
    message?: string;
    error?: string;
  }> {
    const response = await SchoolClassService.createSchoolClass(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        schoolClass: parseRecord<IAdminSchoolClass>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.CreateClass),
      ),
    };
  }

  async updateSchoolClass(
    id: string,
    values: IAdminSchoolClassFormValues,
  ): Promise<{
    success: boolean;
    schoolClass?: IAdminSchoolClass;
    message?: string;
    error?: string;
  }> {
    const response = await SchoolClassService.updateSchoolClass(id, values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        schoolClass: parseRecord<IAdminSchoolClass>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.UpdateClass),
      ),
    };
  }

  async discardSchoolClass(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await SchoolClassService.discardSchoolClass(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.DeleteClass),
      ),
    };
  }

  async undiscardSchoolClass(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await SchoolClassService.undiscardSchoolClass(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.RestoreClass),
      ),
    };
  }
}

export default new SchoolClassController();
