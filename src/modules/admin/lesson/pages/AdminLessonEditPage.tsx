import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useDocumentTitle } from "../../../../hooks";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { iconsLib } from "../../../../assets";
import { Button } from "../../../../design";
import { ButtonVariants, ButtonSizes } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { Admin } from "../..";
import { AdminState, PageHeader } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import type { IAdminLesson, IAdminLessonFormValues } from "../types";
import { AdminLessonForm } from "./AdminLessonForm";
import { AdminLessonSongsSection } from "./AdminLessonSongsSection";
import { AdminLessonStoryVideoSection } from "./AdminLessonStoryVideoSection";
import { AdminLessonStoryOrderSection } from "./AdminLessonStoryOrderSection";
import { AdminLessonVocabsSection } from "./AdminLessonVocabsSection";
import { AdminLessonBuildSentencesSection } from "./AdminLessonBuildSentencesSection";
import { AdminLessonWordFamiliesSection } from "./AdminLessonWordFamiliesSection";
import { AdminLessonQuestionsSection } from "./AdminLessonQuestionsSection";
import { AdminLessonSortHealthyChoicesSection } from "./AdminLessonSortHealthyChoicesSection";

export const AdminLessonEditPage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Lessons.EditTitle)} | Admin`);

  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { setLoading } = useLoading();
  const [lesson, setLesson] = useState<IAdminLesson | null>(null);
  const [loadError, setLoadError] = useState("");

  const loadLesson = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await Admin.LessonController.getLesson(id);
    setLoading(false);
    if (!result.success || !result.lesson) {
      setLesson(null);
      setLoadError(result.error || t(AppLocales.Admin.Lessons.Errors.NotFound));
      return;
    }
    setLesson(result.lesson);
    setLoadError("");
  }, [id, setLoading, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLesson(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLesson]);

  if (loadError || !lesson) {
    return (
      <AdminState
        title={t(AppLocales.Admin.Lessons.EditTitle)}
        message={loadError || t(AppLocales.Admin.Lessons.Errors.NotFound)}
      />
    );
  }

  const handleSubmit = async (values: IAdminLessonFormValues) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, values);
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    toast.success(
      result.message || t(AppLocales.Admin.Lessons.Toasts.UpdateSuccess),
    );
    if (result.lesson) setLesson(result.lesson);
    else void loadLesson();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(AppLocales.Admin.Lessons.EditTitle)}
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
        mode={ADMIN_ACTIONS.EDIT}
        lesson={lesson}
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => navigate(AppRoutes.client.protected.admin.LESSONS)}
      />

      <AdminLessonSongsSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonStoryVideoSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonStoryOrderSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonVocabsSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonBuildSentencesSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonWordFamiliesSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonQuestionsSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
      <AdminLessonSortHealthyChoicesSection
        lesson={lesson}
        onLessonChange={loadLesson}
      />
    </div>
  );
};
