import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import ParentStudentService from "./parent_student.service";
import type {
  IAdminParentStudent,
  IAdminParentStudentFormValues,
  IAdminParentStudentListParams,
} from "./types";

class ParentStudentController {
  async getParentStudents(params?: IAdminParentStudentListParams): Promise<{
    success: boolean;
    links: IAdminParentStudent[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await ParentStudentService.getParentStudents(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminParentStudent>(response);
      return { success: true, links: records, pagination };
    }

    return {
      success: false,
      links: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadParents),
      ),
    };
  }

  async createParentStudent(values: IAdminParentStudentFormValues): Promise<{
    success: boolean;
    link?: IAdminParentStudent;
    message?: string;
    error?: string;
  }> {
    const response = await ParentStudentService.createParentStudent(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        link: parseRecord<IAdminParentStudent>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LinkParent),
      ),
    };
  }

  async discardParentStudent(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await ParentStudentService.discardParentStudent(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.UnlinkParent),
      ),
    };
  }
}

export default new ParentStudentController();
