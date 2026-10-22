import type { TSortOrder } from "../../../hooks/useSort";
import type { IJsonApiResource } from "../../../models";

export const CAMPUS_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type TCampusStatus =
  (typeof CAMPUS_STATUSES)[keyof typeof CAMPUS_STATUSES];

export const ENROLLMENT_STATUSES = {
  ACTIVE: "active",
  LEFT: "left",
} as const;

export type TEnrollmentStatus =
  (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export const CAMPUS_MEMBERSHIP_KINDS = {
  TEACHER_ADMIN: "teacher_admin",
} as const;

export type TCampusMembershipKind =
  (typeof CAMPUS_MEMBERSHIP_KINDS)[keyof typeof CAMPUS_MEMBERSHIP_KINDS];

export interface ICampusUserSummary {
  id: string;
  name: string;
  username: string;
  email: string;
}

export type INestedJsonApi<T extends object> =
  | (T & { id: string })
  | IJsonApiResource<T>;

export interface IAdminCampusImage {
  id: string;
  url?: string | null;
}

export interface IAdminCampus {
  id: string;
  name: string;
  code: string | null;
  phone?: string | null;
  location?: string | null;
  image_asset_id?: string | null;
  image?: INestedJsonApi<IAdminCampusImage> | IAdminCampusImage | null;
  status: TCampusStatus;
  discarded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  school_classes_count?: number;
  teachers_count?: number;
}

export interface IAdminCampusFormValues {
  name: string;
  code?: string | null;
  phone?: string | null;
  location?: string | null;
  image_asset_id?: string | null;
  status: TCampusStatus;
}

export interface IAdminCampusListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  discarded?: boolean;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminSchoolClass {
  id: string;
  campus_id: string;
  name: string;
  level: number;
  status: TCampusStatus;
  discarded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  students_count?: number;
  teachers_count?: number;
  campus?: INestedJsonApi<IAdminCampus> | null;
}

export interface IAdminSchoolClassFormValues {
  campus_id: string;
  name: string;
  level: number;
  status: TCampusStatus;
}

export interface IAdminSchoolClassListParams {
  page?: number;
  limit?: number;
  campus_id?: string;
  level?: number | string;
  status?: string;
  search?: string;
  discarded?: boolean;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminCampusMembership {
  id: string;
  campus_id: string;
  user_id: string;
  kind: TCampusMembershipKind;
  created_at?: string;
  updated_at?: string;
  user?: ICampusUserSummary | null;
  campus?: INestedJsonApi<IAdminCampus> | null;
}

export interface IAdminCampusMembershipFormValues {
  campus_id: string;
  user_id: string;
  kind?: TCampusMembershipKind;
}

export interface IAdminCampusMembershipListParams {
  page?: number;
  limit?: number;
  campus_id?: string;
  kind?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminClassAssignment {
  id: string;
  school_class_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  teacher?: ICampusUserSummary | null;
  school_class?: INestedJsonApi<IAdminSchoolClass> | null;
}

export interface IAdminClassAssignmentFormValues {
  school_class_id: string;
  user_id: string;
}

export interface IAdminClassAssignmentListParams {
  page?: number;
  limit?: number;
  school_class_id?: string;
  campus_id?: string;
  user_id?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminClassEnrollment {
  id: string;
  school_class_id: string;
  user_id: string;
  status: TEnrollmentStatus;
  created_at?: string;
  updated_at?: string;
  student?: ICampusUserSummary | null;
  school_class?: INestedJsonApi<IAdminSchoolClass> | null;
  parents?: ICampusUserSummary[];
}

export interface IAdminClassEnrollmentFormValues {
  school_class_id: string;
  user_id: string;
  status?: TEnrollmentStatus;
}

export interface IAdminClassEnrollmentListParams {
  page?: number;
  limit?: number;
  school_class_id?: string;
  campus_id?: string;
  level?: number | string;
  status?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminCampusStudentsParams {
  page?: number;
  limit?: number;
  level?: number | string;
  school_class_id?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  created_at?: string;
  updated_at?: string;
  parent?: ICampusUserSummary | null;
  student?: ICampusUserSummary | null;
}

export interface IAdminParentStudentFormValues {
  parent_id: string;
  student_id: string;
}

export interface IAdminParentStudentListParams {
  page?: number;
  limit?: number;
  parent_id?: string;
  student_id?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export const HOMEWORK_ACTIVITY_KEYS = {
  LISTEN_AND_TAP: "listen_and_tap",
  SPEAK_AND_RECORD: "speak_and_record",
  TRACE_AND_WRITE: "trace_and_write",
  BLEND_THE_SOUND: "blend_the_sound",
  SORT_THE_WORD_FAMILIES: "sort_the_word_families",
  READ_A_STORY: "read_a_story",
  SING_AND_CHANT: "sing_and_chant",
  PUT_THE_STORY_IN_ORDER: "put_the_story_in_order",
  BUILD_THE_SENTENCES: "build_the_sentences",
  MADE_GOOD_CHOICE: "made_good_choice",
  SORT_HEALTHY_CHOICES: "sort_healthy_choices",
} as const;

export type THomeworkActivityKey =
  (typeof HOMEWORK_ACTIVITY_KEYS)[keyof typeof HOMEWORK_ACTIVITY_KEYS];

export interface IAdminHomeworkLessonSummary {
  id: string;
  title: string;
  level: number;
  unit?: string;
  status?: string;
}

export interface IAdminHomeworkClassSummary {
  id: string;
  name: string;
  level: number;
  campus_id: string;
}

export interface IAdminClassHomework {
  id: string;
  school_class_id: string;
  lesson_id: string;
  activity_keys: THomeworkActivityKey[];
  activity_labels?: string[];
  play_song_at_first: boolean;
  play_story_at_first: boolean;
  title?: string | null;
  due_on?: string | null;
  created_at?: string;
  updated_at?: string;
  lesson?: IAdminHomeworkLessonSummary | null;
  school_class?: IAdminHomeworkClassSummary | null;
}

export interface IAdminClassHomeworkFormValues {
  school_class_id: string;
  lesson_id: string;
  activity_keys: THomeworkActivityKey[];
  play_song_at_first?: boolean;
  play_story_at_first?: boolean;
  title?: string | null;
  due_on?: string | null;
}

export type IAdminClassHomeworkUpdateValues = Omit<
  IAdminClassHomeworkFormValues,
  "school_class_id"
>;

export interface IAdminClassHomeworkListParams {
  page?: number;
  limit?: number;
  school_class_id?: string;
  lesson_id?: string;
  campus_id?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export type TCampusDetailTab =
  | "overview"
  | "classes"
  | "teachers"
  | "students";

