import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import { AlertDialog } from "../../components";
import { ADMIN_CAMPUS_DETAIL_TABS } from "../../campus/constants";
import TeacherController from "../teacher.controller";
import type { IAdminTeacherCreateFormValues } from "../types";
import { AdminTeacherForm } from "./AdminTeacherForm";

export const AdminTeacherCreatePage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Teachers.CreateTitle)} | Admin`);

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
      )}?tab=${ADMIN_CAMPUS_DETAIL_TABS.TEACHERS}`
    : AppRoutes.client.protected.admin.TEACHERS;

  const handleSubmit = async (values: IAdminTeacherCreateFormValues) => {
    setLoading(true, { overlay: false });
    const result = await TeacherController.createTeacher(values);
    setLoading(false, { overlay: false });

    if (result.success && result.result) {
      toast.success(
        result.message || t(AppLocales.Admin.Teachers.Toasts.CreateSuccess),
      );
      navigate(
        AppRoutes.withId(
          AppRoutes.client.protected.admin.TEACHER_DETAIL,
          result.result.membership.id,
        ),
      );
      return;
    }

    setAlertMessage(
      result.error || t(AppLocales.Admin.Teachers.Errors.CreateFailed),
    );
  };

  return (
    <>
      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <AdminTeacherForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(cancelPath)}
      />
    </>
  );
};
