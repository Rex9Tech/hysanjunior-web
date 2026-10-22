import { AnalyticsController, AnalyticsService } from "./analytics";
import { ChatController, ChatService } from "./chat";
import { NotificationController, NotificationService } from "./notification";
import { ProductController, ProductService } from "./product";
import { RoleController, RoleService } from "./role";
import UserController from "./user/user.controller";
import UserService from "./user/user.service";
import { FeedbackController, FeedbackService } from "./feedback";
import { LogController, LogService } from "./log";
import { AccessController, AccessService } from "./access";
import { AssetController, AssetService } from "./asset";
import { VersionController, VersionService } from "./version";
import { PaymentController, PaymentService } from "./payment";
import { AiController, AiService } from "./ai";
import { LessonController, LessonService } from "./lesson";
import {
  StudentController,
} from "./student";
import {
  TeacherController,
} from "./teacher";
import {
  CampusController,
  CampusService,
  SchoolClassController,
  SchoolClassService,
  CampusMembershipController,
  CampusMembershipService,
  ClassAssignmentController,
  ClassAssignmentService,
  ClassEnrollmentController,
  ClassEnrollmentService,
  ParentStudentController,
  ParentStudentService,
} from "./campus";

export * from "./analytics";
export * from "./chat";
export * from "./notification";
export * from "./product";
export * from "./access";
export * from "./feedback";
export * from "./log";
export * from "./role";
export * from "./user";
export * from "./asset";
export * from "./version";
export * from "./payment";
export * from "./ai";
export * from "./lesson";
export * from "./campus";
export * from "./student";
export * from "./teacher";
export * from "./components";
export * from "./helpers/admin.helper";
export * from "./constants";

export const Admin = {
  AnalyticsController,
  AnalyticsService,
  ChatController,
  ChatService,
  NotificationController,
  NotificationService,
  ProductController,
  ProductService,
  RoleController,
  RoleService,
  UserController,
  UserService,
  AccessController,
  AccessService,
  FeedbackController,
  FeedbackService,
  LogController,
  LogService,
  AssetController,
  AssetService,
  VersionController,
  VersionService,
  PaymentController,
  PaymentService,
  AiController,
  AiService,
  LessonController,
  LessonService,
  CampusController,
  CampusService,
  SchoolClassController,
  SchoolClassService,
  CampusMembershipController,
  CampusMembershipService,
  ClassAssignmentController,
  ClassAssignmentService,
  ClassEnrollmentController,
  ClassEnrollmentService,
  ParentStudentController,
  ParentStudentService,
  StudentController,
  TeacherController,
};
