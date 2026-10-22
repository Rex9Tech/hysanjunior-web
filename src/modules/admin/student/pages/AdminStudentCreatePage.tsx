import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import { AlertDialog } from "../../components";
import { ADMIN_CAMPUS_DETAIL_TABS } from "../../campus/constants";
import StudentController from "../student.controller";
import type { IAdminStudentCreateFormValues } from "../types";
import { AdminStudentForm } from "./AdminStudentForm";

export const AdminStudentCreatePage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Students.CreateTitle)} | Admin`);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { setLoading } = useLoading();
  const [alertMessage, setAlertMessage] = useState("");
  const campusId = searchParams.get("campus_id") || "";

  const cancelPath = campusId
    ? `${AppRoutes.withId(
        AppRoutes.client.protected.admin.CAMPUS_DETAIL,
        campusId,
      )}?tab=${ADMIN_CAMPUS_DETAIL_TABS.STUDENTS}`
    : AppRoutes.client.protected.admin.STUDENTS;

  const handleSubmit = async (values: IAdminStudentCreateFormValues) => {
    setLoading(true, { overlay: false });
    const result = await StudentController.createStudent(values);
    setLoading(false, { overlay: false });

    if (result.success && result.result) {
      toast.success(
        result.message || t(AppLocales.Admin.Students.Toasts.CreateSuccess),
      );
      navigate(
        AppRoutes.withId(
          AppRoutes.client.protected.admin.STUDENT_DETAIL,
          result.result.enrollment.id,
        ),
      );
      return;
    }

    setAlertMessage(
      result.error || t(AppLocales.Admin.Students.Errors.CreateFailed),
    );
  };

  return (
    <>
      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <AdminStudentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(cancelPath)}
      />
    </>
  );
};
