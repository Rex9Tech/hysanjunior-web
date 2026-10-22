import type { IAdminUser } from "../user/types";
import type { IAdminCampusMembership } from "../campus/types";

export interface IAdminTeacherIdentityValues {
  username: string;
  name: string;
  email: string;
}

export interface IAdminTeacherCreateFormValues {
  teacher: IAdminTeacherIdentityValues;
  campus_id: string;
  school_class_id?: string;
}

export interface IAdminTeacherListParams {
  page?: number;
  limit?: number;
  campus_id?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export type IAdminTeacherMembership = IAdminCampusMembership;

export interface IAdminTeacherCreateResult {
  membership: IAdminTeacherMembership;
  teacher: IAdminUser;
}
