import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import ClassAssignmentService from "./class_assignment.service";
import type {
  IAdminClassAssignment,
  IAdminClassAssignmentFormValues,
  IAdminClassAssignmentListParams,
} from "./types";

class ClassAssignmentController {
  async getAssignments(params?: IAdminClassAssignmentListParams): Promise<{
    success: boolean;
    assignments: IAdminClassAssignment[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await ClassAssignmentService.getAssignments(params);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      const { records, pagination } =
        parsePagyList<IAdminClassAssignment>(response);
      return { success: true, assignments: records, pagination };
    }

    return {
      success: false,
      assignments: [],
      pagination: null,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadAssignments),
      ),
    };
  }

  async createAssignment(values: IAdminClassAssignmentFormValues): Promise<{
    success: boolean;
    assignment?: IAdminClassAssignment;
    message?: string;
    error?: string;
  }> {
    const response = await ClassAssignmentService.createAssignment(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        assignment: parseRecord<IAdminClassAssignment>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.AssignTeacher),
      ),
    };
  }

  async discardAssignment(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await ClassAssignmentService.discardAssignment(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.UnassignTeacher),
      ),
    };
  }
}

export default new ClassAssignmentController();
