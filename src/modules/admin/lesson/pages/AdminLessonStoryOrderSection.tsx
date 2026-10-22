import React, { useEffect, useRef, useState } from "react";
import { iconsLib } from "../../../../assets";
import { Button, DetailSection, TextArea } from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import SocketService, {
  type ISocketMessage,
} from "../../../../services/socket.service";
import { NOTIFICATION_SOCKET_TYPES } from "../../../notification/constants";
import { Admin } from "../..";
import {
  finishLessonAiGenerating,
  clearLessonAiGenerating,
  isLessonAiGenerating,
  LESSON_AI_PREVIEW_KINDS,
  markLessonAiGenerating,
  parseLessonAiSocketMessage,
  readLessonAiPreview,
} from "../../../../helpers/lessonAiSocket";
import type { IAdminLesson } from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

const KIND = LESSON_AI_PREVIEW_KINDS.STORY_ORDER;

const applyStoryOrder = (lines: string[]) =>
  lines.map((line) => line.trim()).filter(Boolean).join("\n");

export const AdminLessonStoryOrderSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  toastRef.current = toast;
  tRef.current = t;

  const [sentences, setSentences] = useState(lesson.story_order.join("\n"));
  const [isGenerating, setIsGenerating] = useState(() =>
    isLessonAiGenerating(lesson.id, KIND),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLessonAiGenerating(lesson.id, KIND)) {
      setIsGenerating(true);
    }
  }, [lesson.id]);

  useEffect(() => {
    if (isGenerating) return;
    setSentences(lesson.story_order.join("\n"));
  }, [lesson.story_order, isGenerating]);

  useEffect(() => {
    const handler = (message: ISocketMessage) => {
      const data = parseLessonAiSocketMessage(message, lesson.id);
      if (!data) return;

      if (data.type === NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_GENERATED) {
        const next = data.story_order ?? [];
        if (!next.length) return;
        setIsGenerating(false);
        setSentences(applyStoryOrder(next));
        finishLessonAiGenerating(lesson.id, KIND);
        toastRef.current.success(
          tRef.current(
            AppLocales.Admin.Lessons.StoryOrder.Toasts.GenerateSuccess,
          ),
        );
      }

      if (data.type === NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_FAILED) {
        setIsGenerating(false);
        clearLessonAiGenerating(lesson.id, KIND);
        toastRef.current.error(
          data.error ||
            tRef.current(AppLocales.Admin.Lessons.StoryOrder.Errors.Generate),
        );
      }
    };

    SocketService.addListener(handler);
    return () => SocketService.removeListener(handler);
  }, [lesson.id]);

  useEffect(() => {
    if (!isGenerating) return;

    const applyCached = () => {
      if (!isLessonAiGenerating(lesson.id, KIND)) return;
      const cached = readLessonAiPreview<string[]>(lesson.id, KIND);
      if (!cached?.length) return;
      setSentences(applyStoryOrder(cached));
      setIsGenerating(false);
      finishLessonAiGenerating(lesson.id, KIND);
      toastRef.current.success(
        tRef.current(
          AppLocales.Admin.Lessons.StoryOrder.Toasts.GenerateSuccess,
        ),
      );
    };

    applyCached();
    const timer = window.setInterval(applyCached, 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating, lesson.id]);

  const handleGenerate = async () => {
    markLessonAiGenerating(lesson.id, KIND);
    setIsGenerating(true);
    const result = await Admin.LessonController.createStoryOrder(lesson.id);
    if (!result.success) {
      setIsGenerating(false);
      clearLessonAiGenerating(lesson.id, KIND);
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.AiQueue));
    }
  };

  const handleSave = async () => {
    const next = sentences
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setIsSaving(true);
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      story_order: next,
    });
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    toast.success(t(AppLocales.Admin.Lessons.StoryOrder.Toasts.SaveSuccess));
    onLessonChange();
  };

  const pendingLabel = t(AppLocales.Admin.Lessons.Ai.Pending);

  return (
    <DetailSection
      accent
      title={t(AppLocales.Admin.Lessons.StoryOrder.Title)}
      description={t(AppLocales.Admin.Lessons.StoryOrder.Description)}
      icon={iconsLib.document}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            size={ButtonSizes.SM}
            variant={ButtonVariants.SECONDARY}
            onClick={() => void handleGenerate()}
            isLoading={isGenerating}
            disabled={isGenerating}
          >
            <iconsLib.sparkles className="mr-1.5 h-4 w-4" />
            {t(AppLocales.Admin.Lessons.StoryOrder.GenerateButton)}
          </Button>
          <Button
            size={ButtonSizes.SM}
            onClick={() => void handleSave()}
            isLoading={isSaving}
            disabled={isSaving || isGenerating}
          >
            {t(AppLocales.Admin.Lessons.StoryOrder.SaveButton)}
          </Button>
        </div>
      }
    >
      <TextArea
        label={t(AppLocales.Admin.Lessons.StoryOrder.SentencesLabel)}
        helperText={
          isGenerating
            ? pendingLabel
            : t(AppLocales.Admin.Lessons.StoryOrder.SentencesHelper)
        }
        value={isGenerating ? pendingLabel : sentences}
        onChange={(e) => setSentences(e.target.value)}
        rows={6}
        readOnly={isGenerating}
      />
    </DetailSection>
  );
};
