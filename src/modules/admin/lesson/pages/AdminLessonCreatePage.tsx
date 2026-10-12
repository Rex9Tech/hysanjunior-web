import React from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useDocumentTitle } from "../../../../hooks";
import { useToast } from "../../../../contexts/ToastContext";
import { iconsLib } from "../../../../assets";
import { Button } from "../../../../design";
import { ButtonVariants, ButtonSizes } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { PageHeader } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { createLesson } from "../lesson.mock.store";
import type { IAdminLessonFormValues } from "../types";
import { AdminLessonForm } from "./AdminLessonForm";

export const AdminLessonCreatePage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Lessons.CreateTitle)} | Admin`);

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = (values: IAdminLessonFormValues) => {
    createLesson(values);
    toast.success(t(AppLocales.Admin.Lessons.Toasts.CreateSuccess));
    navigate(AppRoutes.client.protected.admin.LESSONS, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(AppLocales.Admin.Lessons.CreateTitle)}
        description={t(AppLocales.Admin.Lessons.Description)}
        action={
          <Button
            variant={ButtonVariants.SECONDARY}
            size={ButtonSizes.SM}
            onClick={() => navigate(AppRoutes.client.protected.admin.LESSONS)}
          >
            <iconsLib.arrowLeft className="mr-1.5 h-4 w-4" />
            {t(AppLocales.Admin.Lessons.Title)}
          </Button>
        }
      />
      <AdminLessonForm
        mode={ADMIN_ACTIONS.CREATE}
        onSubmit={handleSubmit}
        onCancel={() => navigate(AppRoutes.client.protected.admin.LESSONS)}
      />
    </div>
  );
};
