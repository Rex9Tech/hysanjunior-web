import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppRoutes from "../../../../AppRoutes";
import { useDocumentTitle } from "../../../../hooks";
import { useToast } from "../../../../contexts/ToastContext";
import { iconsLib } from "../../../../assets";
import { Button } from "../../../../design";
import { ButtonVariants, ButtonSizes } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { AdminState, PageHeader } from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { getLesson, updateLesson } from "../lesson.mock.store";
import type { IAdminLessonFormValues } from "../types";
import { AdminLessonForm } from "./AdminLessonForm";
import { AdminLessonBuildSentencesSection } from "./AdminLessonBuildSentencesSection";
import { AdminLessonHealthyChoicesSection } from "./AdminLessonHealthyChoicesSection";
import { AdminLessonSongsSection } from "./AdminLessonSongsSection";
import { AdminLessonSortHealthyChoicesSection } from "./AdminLessonSortHealthyChoicesSection";
import { AdminLessonStorySummarySection } from "./AdminLessonStorySummarySection";
import { AdminLessonStoryVideoSection } from "./AdminLessonStoryVideoSection";
import { AdminLessonVocabsSection } from "./AdminLessonVocabsSection";
import { AdminLessonWordFamiliesSection } from "./AdminLessonWordFamiliesSection";

export const AdminLessonEditPage: React.FC = () => {
  const t = useTranslate();
  useDocumentTitle(`${t(AppLocales.Admin.Lessons.EditTitle)} | Admin`);

  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const lesson = useMemo(
    () => (id ? getLesson(id) : null),
    [id, refreshKey],
  );

  const refreshLesson = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  if (!lesson) {
    return (
      <AdminState
        title={t(AppLocales.Admin.Lessons.EditTitle)}
        message={t(AppLocales.Admin.Lessons.Errors.NotFound)}
      />
    );
  }

  const handleSubmit = (values: IAdminLessonFormValues) => {
    const updated = updateLesson(lesson.id, values);
    if (!updated) {
      toast.error(t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    toast.success(t(AppLocales.Admin.Lessons.Toasts.UpdateSuccess));
    navigate(AppRoutes.client.protected.admin.LESSONS, { replace: true });
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
        onSubmit={handleSubmit}
        onCancel={() => navigate(AppRoutes.client.protected.admin.LESSONS)}
      />

      <AdminLessonSongsSection
        lessonId={lesson.id}
        song={lesson.song}
        onSongChange={refreshLesson}
      />

      <AdminLessonStoryVideoSection
        lessonId={lesson.id}
        storyVideo={lesson.storyVideo}
        onStoryChange={refreshLesson}
      />

      <AdminLessonStorySummarySection
        lessonId={lesson.id}
        storySummary={lesson.storySummary}
        onStorySummaryChange={refreshLesson}
      />

      <AdminLessonVocabsSection
        lessonId={lesson.id}
        vocabs={lesson.vocabs}
        onVocabsChange={refreshLesson}
      />

      <AdminLessonBuildSentencesSection
        lessonId={lesson.id}
        vocabs={lesson.vocabs}
        storyVideo={lesson.storyVideo}
        buildSentenceSet={lesson.buildSentenceSet}
        onBuildSentencesChange={refreshLesson}
      />

      <AdminLessonWordFamiliesSection
        lessonId={lesson.id}
        storyVideo={lesson.storyVideo}
        wordFamilySet={lesson.wordFamilySet}
        onWordFamiliesChange={refreshLesson}
      />

      <AdminLessonHealthyChoicesSection
        lessonId={lesson.id}
        healthyChoices={lesson.healthyChoices}
        onHealthyChoicesChange={refreshLesson}
      />

      <AdminLessonSortHealthyChoicesSection
        lessonId={lesson.id}
        sortHealthyChoice={lesson.sortHealthyChoice}
        onSortHealthyChoiceChange={refreshLesson}
      />
    </div>
  );
};
