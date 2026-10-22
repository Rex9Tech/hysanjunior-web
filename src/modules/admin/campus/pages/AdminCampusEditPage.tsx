import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useDocumentTitle } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import { AlertDialog, AdminState } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import CampusController from "../campus.controller";
import type { IAdminCampus, IAdminCampusFormValues } from "../types";
import { AdminCampusForm } from "./AdminCampusForm";

export const AdminCampusEditPage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Campuses.EditTitle)} | Admin`);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading } = useLoading();
  const [campus, setCampus] = useState<IAdminCampus | null>(null);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      const result = await CampusController.getCampus(id);
      setLoading(false);

      if (result.success && result.campus) {
        setCampus(result.campus);
      } else {
        setError(result.error || t(AppLocales.Admin.Campuses.Errors.LoadOne));
      }
    };

    void load();
  }, [id, setLoading, t]);

  const handleSubmit = async (values: IAdminCampusFormValues) => {
    if (!id) return;

    setLoading(true, { overlay: false });
    const result = await CampusController.updateCampus(id, values);
    setLoading(false, { overlay: false });

    if (result.success) {
      toast.success(
        result.message || t(AppLocales.Admin.Campuses.Toasts.UpdateSuccess),
      );
      navigate(
        AppRoutes.withId(AppRoutes.client.protected.admin.CAMPUS_DETAIL, id),
      );
    } else {
      setAlertMessage(
        result.error || t(AppLocales.Admin.Campuses.Errors.Update),
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
      {error || !campus ? (
        <AdminState
          title={t(AppLocales.Admin.Common.State.ErrorTitle)}
          message={error || t(AppLocales.Admin.Campuses.Errors.LoadOne)}
        />
      ) : (
        <AdminCampusForm
          mode={ADMIN_ACTIONS.EDIT}
          campus={campus}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(
              AppRoutes.withId(
                AppRoutes.client.protected.admin.CAMPUS_DETAIL,
                campus.id,
              ),
            )
          }
        />
      )}
    </>
  );
};
