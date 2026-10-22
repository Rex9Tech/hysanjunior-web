import type { IAdminUser } from "../user/types";
import type {
  IAdminClassEnrollment,
  ICampusUserSummary,
} from "../campus/types";

export const PARENT_MODES = {
  NONE: "none",
  CREATE: "create",
  LINK: "link",
} as const;

export type TParentMode = (typeof PARENT_MODES)[keyof typeof PARENT_MODES];

export interface IAdminStudentIdentityValues {
  username: string;
  name: string;
  email: string;
}

export interface IAdminStudentCreateFormValues {
  student: IAdminStudentIdentityValues;
  campus_id: string;
  level: number;
  school_class_id: string;
  parent_mode: TParentMode;
  parent?: IAdminStudentIdentityValues;
  parent_user_id?: string;
}

export interface IAdminStudentListParams {
  page?: number;
  limit?: number;
  campus_id?: string;
  level?: number | string;
  school_class_id?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export type IAdminStudentEnrollment = IAdminClassEnrollment;

export interface IAdminStudentCreateResult {
  enrollment: IAdminStudentEnrollment;
  student: IAdminUser;
  parent?: IAdminUser | ICampusUserSummary | null;
}
