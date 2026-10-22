import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import ClassHomeworkService from "./class_homework.service";
import type {
  IAdminClassHomework,
  IAdminClassHomeworkFormValues,
  IAdminClassHomeworkListParams,
  IAdminClassHomeworkUpdateValues,
} from "./types";

class ClassHomeworkController {
  async getHomeworks(params?: IAdminClassHomeworkListParams): Promise<{
    success: boolean;
    homeworks: IAdminClassHomework[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await ClassHomeworkService.getHomeworks(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminClassHomework>(response);
      return { success: true, homeworks: records, pagination };
    }

    return {
      success: false,
      homeworks: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadHomeworks),
      ),
    };
  }

  async createHomework(values: IAdminClassHomeworkFormValues): Promise<{
    success: boolean;
    homework?: IAdminClassHomework;
    message?: string;
    error?: string;
  }> {
    const response = await ClassHomeworkService.createHomework(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        homework: parseRecord<IAdminClassHomework>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.AssignHomework),
      ),
    };
  }

  async updateHomework(
    id: string,
    values: IAdminClassHomeworkUpdateValues,
  ): Promise<{
    success: boolean;
    homework?: IAdminClassHomework;
    message?: string;
    error?: string;
  }> {
    const response = await ClassHomeworkService.updateHomework(id, values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        homework: parseRecord<IAdminClassHomework>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.UpdateHomework),
      ),
    };
  }

  async discardHomework(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await ClassHomeworkService.discardHomework(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.DiscardHomework),
      ),
    };
  }
}

export default new ClassHomeworkController();
