import { AppLocales, translate } from "../../../locales";
import type { IApiPagination } from "../../../models";
import CampusMembershipController from "../campus/campus_membership.controller";
import ClassAssignmentController from "../campus/class_assignment.controller";
import type {
  IAdminCampusMembership,
  IAdminClassAssignment,
} from "../campus/types";
import {
  CAMPUS_MEMBERSHIP_KINDS,
} from "../campus/types";
import UserController from "../user/user.controller";
import type { IAdminUser } from "../user/types";
import { ADMIN_TEACHER_ROLE_NAMES } from "./constants";
import type {
  IAdminTeacherCreateFormValues,
  IAdminTeacherCreateResult,
  IAdminTeacherListParams,
} from "./types";

class TeacherController {
  async getTeachers(params?: IAdminTeacherListParams): Promise<{
    success: boolean;
    memberships: IAdminCampusMembership[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    return CampusMembershipController.getMemberships({
      page: params?.page,
      limit: params?.limit,
      campus_id: params?.campus_id,
      kind: CAMPUS_MEMBERSHIP_KINDS.TEACHER_ADMIN,
      sort_by: params?.sort_by,
      sort_order: params?.sort_order,
    });
  }

  async getTeacherMembership(id: string): Promise<{
    success: boolean;
    membership?: IAdminCampusMembership;
    error?: string;
  }> {
    return CampusMembershipController.getMembership(id);
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
          translate(AppLocales.Admin.Teachers.Errors.LoadRoles),
      };
    }

    const role = rolesResult.roles.find((item) => item.name === roleName);
    if (!role) {
      return {
        success: false,
        error: translate(AppLocales.Admin.Teachers.Errors.RoleMissing, {
          role: roleName,
        }),
      };
    }

    return { success: true, roleId: role.id };
  }

  async createTeacher(
    values: IAdminTeacherCreateFormValues,
  ): Promise<{
    success: boolean;
    result?: IAdminTeacherCreateResult;
    message?: string;
    error?: string;
  }> {
    const roleResult = await this.findRoleId(
      ADMIN_TEACHER_ROLE_NAMES.TEACHER_ADMIN,
    );
    if (!roleResult.success || !roleResult.roleId) {
      return { success: false, error: roleResult.error };
    }

    const createResult = await UserController.createUser({
      username: values.teacher.username,
      name: values.teacher.name,
      email: values.teacher.email,
      role_ids: [roleResult.roleId],
    });

    if (!createResult.success || !createResult.user) {
      return {
        success: false,
        error:
          createResult.error ||
          translate(AppLocales.Admin.Teachers.Errors.CreateTeacher),
      };
    }

    const membershipResult = await CampusMembershipController.createMembership({
      campus_id: values.campus_id,
      user_id: createResult.user.id,
      kind: CAMPUS_MEMBERSHIP_KINDS.TEACHER_ADMIN,
    });

    if (!membershipResult.success || !membershipResult.membership) {
      return {
        success: false,
        error:
          membershipResult.error ||
          translate(AppLocales.Admin.Teachers.Errors.AttachCampus),
      };
    }

    if (values.school_class_id) {
      const assignmentResult = await ClassAssignmentController.createAssignment(
        {
          school_class_id: values.school_class_id,
          user_id: createResult.user.id,
        },
      );

      if (!assignmentResult.success) {
        return {
          success: false,
          error:
            assignmentResult.error ||
            translate(AppLocales.Admin.Teachers.Errors.AssignClass),
        };
      }
    }

    const refreshed = await CampusMembershipController.getMembership(
      membershipResult.membership.id,
    );

    return {
      success: true,
      result: {
        membership: refreshed.membership || membershipResult.membership,
        teacher: createResult.user,
      },
      message: translate(AppLocales.Admin.Teachers.Toasts.CreateSuccess),
    };
  }

  async getClassAssignments(userId: string, campusId?: string): Promise<{
    success: boolean;
    assignments: IAdminClassAssignment[];
    pagination: IApiPagination | null;
    error?: string;
  }> {
    return ClassAssignmentController.getAssignments({
      user_id: userId,
      campus_id: campusId,
      limit: 100,
    });
  }

  async assignClass(
    userId: string,
    schoolClassId: string,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result = await ClassAssignmentController.createAssignment({
      school_class_id: schoolClassId,
      user_id: userId,
    });
    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          translate(AppLocales.Admin.Teachers.Errors.AssignClass),
      };
    }
    return {
      success: true,
      message:
        result.message ||
        translate(AppLocales.Admin.Teachers.Toasts.AssignClassSuccess),
    };
  }

  async unassignClass(assignmentId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result =
      await ClassAssignmentController.discardAssignment(assignmentId);
    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          translate(AppLocales.Admin.Teachers.Errors.UnassignClass),
      };
    }
    return {
      success: true,
      message:
        result.message ||
        translate(AppLocales.Admin.Teachers.Toasts.UnassignClassSuccess),
    };
  }

  async removeFromCampus(membershipId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result =
      await CampusMembershipController.discardMembership(membershipId);
    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          translate(AppLocales.Admin.Teachers.Errors.RemoveCampus),
      };
    }
    return {
      success: true,
      message:
        result.message ||
        translate(AppLocales.Admin.Teachers.Toasts.RemoveCampusSuccess),
    };
  }
}

export default new TeacherController();
