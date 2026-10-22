import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import { AlertDialog } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import CampusController from "../campus.controller";
import type { IAdminCampusFormValues } from "../types";
import { AdminCampusForm } from "./AdminCampusForm";

export const AdminCampusCreatePage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Campuses.CreateTitle)} | Admin`);

  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading } = useLoading();
  const [alertMessage, setAlertMessage] = useState("");

  const handleSubmit = async (values: IAdminCampusFormValues) => {
    setLoading(true, { overlay: false });
    const result = await CampusController.createCampus(values);
    setLoading(false, { overlay: false });

    if (result.success && result.campus) {
      toast.success(
        result.message || t(AppLocales.Admin.Campuses.Toasts.CreateSuccess),
      );
      navigate(
        AppRoutes.withId(
          AppRoutes.client.protected.admin.CAMPUS_DETAIL,
          result.campus.id,
        ),
      );
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.Create),
      );
    }
  };

  return (
    <>
      <AlertDialog
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <AdminCampusForm
        mode={ADMIN_ACTIONS.CREATE}
        onSubmit={handleSubmit}
        onCancel={() => navigate(AppRoutes.client.protected.admin.CAMPUSES)}
      />
    </>
  );
};
