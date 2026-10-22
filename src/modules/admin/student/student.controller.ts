import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import ClassEnrollmentController from "../campus/class_enrollment.controller";
import ParentStudentController from "../campus/parent_student.controller";
import type { IAdminClassEnrollment } from "../campus/types";
import UserController from "../user/user.controller";
import type { IAdminUser } from "../user/types";
import { ADMIN_STUDENT_ROLE_NAMES } from "./constants";
import {
  PARENT_MODES,
  type IAdminStudentCreateFormValues,
  type IAdminStudentCreateResult,
  type IAdminStudentListParams,
} from "./types";

class StudentController {
  async getStudents(params?: IAdminStudentListParams): Promise<{
    success: boolean;
    enrollments: IAdminClassEnrollment[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    return ClassEnrollmentController.getEnrollments({
      page: params?.page,
      limit: params?.limit,
      campus_id: params?.campus_id,
      level: params?.level,
      school_class_id: params?.school_class_id,
      status: params?.status || "active",
      sort_by: params?.sort_by,
      sort_order: params?.sort_order,
    });
  }

  async getStudentEnrollment(id: string): Promise<{
    success: boolean;
    enrollment?: IAdminClassEnrollment;
    error?: string;
  }> {
    return ClassEnrollmentController.getEnrollment(id);
  }

  private async findRoleId(roleName: string): Promise<{
    success: boolean;
    roleId?: string;
    error?: string;
  }> {
    const rolesResult = await UserController.getRoles();
    if (!rolesResult.success) {
      return {
        success: false,
        error:
          rolesResult.error ||
          translate(AppLocales.Admin.Students.Errors.LoadRoles),
      };
    }

    const role = rolesResult.roles.find((item) => item.name === roleName);
    if (!role) {
      return {
        success: false,
        error: translate(AppLocales.Admin.Students.Errors.RoleMissing, {
          role: roleName,
        }),
      };
    }

    return { success: true, roleId: role.id };
  }

  private async createUserWithRole(
    values: { username: string; name: string; email: string },
    roleName: string,
  ): Promise<{ success: boolean; user?: IAdminUser; error?: string }> {
    const roleResult = await this.findRoleId(roleName);
    if (!roleResult.success || !roleResult.roleId) {
      return { success: false, error: roleResult.error };
    }

    const createResult = await UserController.createUser({
      username: values.username,
      name: values.name,
      email: values.email,
      role_ids: [roleResult.roleId],
    });

    if (!createResult.success || !createResult.user) {
      return {
        success: false,
        error:
          createResult.error ||
          translate(AppLocales.Admin.Students.Errors.CreateStudent),
      };
    }

    return { success: true, user: createResult.user };
  }

  async createStudent(
    values: IAdminStudentCreateFormValues,
  ): Promise<{
    success: boolean;
    result?: IAdminStudentCreateResult;
    message?: string;
    error?: string;
  }> {
    const studentResult = await this.createUserWithRole(
      values.student,
      ADMIN_STUDENT_ROLE_NAMES.STUDENT,
    );
    if (!studentResult.success || !studentResult.user) {
      return {
        success: false,
        error:
          studentResult.error ||
          translate(AppLocales.Admin.Students.Errors.CreateStudent),
      };
    }

    let parentUser: IAdminUser | null = null;

    if (values.parent_mode === PARENT_MODES.CREATE) {
      if (!values.parent) {
        return {
          success: false,
          error: translate(AppLocales.Admin.Students.Errors.ParentRequired),
        };
      }

      const parentResult = await this.createUserWithRole(
        values.parent,
        ADMIN_STUDENT_ROLE_NAMES.PARENT,
      );
      if (!parentResult.success || !parentResult.user) {
        return {
          success: false,
          error:
            parentResult.error ||
            translate(AppLocales.Admin.Students.Errors.CreateParent),
        };
      }
      parentUser = parentResult.user;
    }

    if (
      values.parent_mode === PARENT_MODES.LINK &&
      !values.parent_user_id
    ) {
      return {
        success: false,
        error: translate(AppLocales.Admin.Students.Errors.ParentRequired),
      };
    }

    const enrollmentResult = await ClassEnrollmentController.createEnrollment({
      school_class_id: values.school_class_id,
      user_id: studentResult.user.id,
      status: "active",
    });

    if (!enrollmentResult.success || !enrollmentResult.enrollment) {
      return {
        success: false,
        error:
          enrollmentResult.error ||
          translate(AppLocales.Admin.Students.Errors.Enroll),
      };
    }

    const parentId =
      values.parent_mode === PARENT_MODES.CREATE
        ? parentUser?.id
        : values.parent_mode === PARENT_MODES.LINK
          ? values.parent_user_id
          : undefined;

    if (parentId) {
      const linkResult = await ParentStudentController.createParentStudent({
        parent_id: parentId,
        student_id: studentResult.user.id,
      });

      if (!linkResult.success) {
        return {
          success: false,
          error:
            linkResult.error ||
            translate(AppLocales.Admin.Students.Errors.LinkParent),
        };
      }
    }

    const refreshed = await ClassEnrollmentController.getEnrollment(
      enrollmentResult.enrollment.id,
    );

    return {
      success: true,
      result: {
        enrollment: refreshed.enrollment || enrollmentResult.enrollment,
        student: studentResult.user,
        parent: parentUser,
      },
      message: translate(AppLocales.Admin.Students.Toasts.CreateSuccess),
    };
  }

  async changeClass(
    enrollmentId: string,
    schoolClassId: string,
  ): Promise<{
    success: boolean;
    enrollment?: IAdminClassEnrollment;
    message?: string;
    error?: string;
  }> {
    return ClassEnrollmentController.updateEnrollment(enrollmentId, {
      school_class_id: schoolClassId,
    });
  }

  async linkParent(
    studentId: string,
    parentId: string,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result = await ParentStudentController.createParentStudent({
      parent_id: parentId,
      student_id: studentId,
    });
    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          translate(AppLocales.Admin.Students.Errors.LinkParent),
      };
    }
    return {
      success: true,
      message:
        result.message ||
        translate(AppLocales.Admin.Students.Toasts.LinkParentSuccess),
    };
  }

  async unlinkParent(linkId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result = await ParentStudentController.discardParentStudent(linkId);
    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          translate(AppLocales.Admin.Students.Errors.UnlinkParent),
      };
    }
    return {
      success: true,
      message:
        result.message ||
        translate(AppLocales.Admin.Students.Toasts.UnlinkParentSuccess),
    };
  }
}

export default new StudentController();
