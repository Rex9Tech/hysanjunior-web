import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import {
  getApiError,
  parsePagyList,
  parseRecord,
} from "../../../services/api.service";
import ClassEnrollmentService from "./class_enrollment.service";
import type {
  IAdminClassEnrollment,
  IAdminClassEnrollmentFormValues,
  IAdminClassEnrollmentListParams,
} from "./types";

class ClassEnrollmentController {
  async getEnrollments(params?: IAdminClassEnrollmentListParams): Promise<{
    success: boolean;
    enrollments: IAdminClassEnrollment[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    const response = await ClassEnrollmentService.getEnrollments(params);
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
        translate(AppLocales.Admin.Campuses.Errors.LoadEnrollments),
      ),
    };
  }

  async getEnrollment(id: string): Promise<{
    success: boolean;
    enrollment?: IAdminClassEnrollment;
    error?: string;
  }> {
    const response = await ClassEnrollmentService.getEnrollment(id);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        enrollment: parseRecord<IAdminClassEnrollment>(data),
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.LoadEnrollments),
      ),
    };
  }

  async updateEnrollment(
    id: string,
    values: Pick<IAdminClassEnrollmentFormValues, "school_class_id" | "status">,
  ): Promise<{
    success: boolean;
    enrollment?: IAdminClassEnrollment;
    message?: string;
    error?: string;
  }> {
    const response = await ClassEnrollmentService.updateEnrollment(id, values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        enrollment: parseRecord<IAdminClassEnrollment>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.EnrollStudent),
      ),
    };
  }

  async createEnrollment(values: IAdminClassEnrollmentFormValues): Promise<{
    success: boolean;
    enrollment?: IAdminClassEnrollment;
    message?: string;
    error?: string;
  }> {
    const response = await ClassEnrollmentService.createEnrollment(values);
    const { status, data } = response.data || {};

    if (status?.success && data) {
      return {
        success: true,
        enrollment: parseRecord<IAdminClassEnrollment>(data),
        message: status.message,
      };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.EnrollStudent),
      ),
    };
  }

  async discardEnrollment(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await ClassEnrollmentService.discardEnrollment(id);
    const { status } = response.data || {};

    if (status?.success) {
      return { success: true, message: status.message };
    }

    return {
      success: false,
      error: getApiError(
        response,
        translate(AppLocales.Admin.Campuses.Errors.UnenrollStudent),
      ),
    };
  }
}

export default new ClassEnrollmentController();
