import React from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { iconsLib } from "../../../../assets";
import { useToast } from "../../../../contexts/ToastContext";
import { Button } from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useDocumentTitle } from "../../../../hooks";
import { AppLocales, useTranslate } from "../../../../locales";
import { PageHeader } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { Admin } from "../..";
import type { IAdminLessonFormValues } from "../types";
import { AdminLessonForm } from "./AdminLessonForm";

export const AdminLessonCreatePage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Lessons.CreateTitle)} | Admin`);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (values: IAdminLessonFormValues) => {
    const result = await Admin.LessonController.createLesson(values);
    if (!result.success || !result.lesson) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Create));
      return;
    }
    toast.success(
      result.message || t(AppLocales.Admin.Lessons.Toasts.CreateSuccess),
    );
    navigate(
      AppRoutes.withId(
        AppRoutes.client.protected.admin.LESSON_EDIT,
        result.lesson.id,
      ),
      { replace: true },
    );
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
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => navigate(AppRoutes.client.protected.admin.LESSONS)}
      />
    </div>
  );
};
