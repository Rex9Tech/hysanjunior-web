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
  clearLessonAiPreview,
  LESSON_AI_PREVIEW_KINDS,
  parseLessonAiSocketMessage,
  readLessonAiPreview,
} from "../../../../helpers/lessonAiSocket";
import type { IAdminLesson } from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        setIsGenerating(false);
        setSentences(applyStoryOrder(next));
        clearLessonAiPreview(lesson.id, LESSON_AI_PREVIEW_KINDS.STORY_ORDER);
        toastRef.current.success(
          tRef.current(
            AppLocales.Admin.Lessons.StoryOrder.Toasts.GenerateSuccess,
          ),
        );
      }

      if (data.type === NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_FAILED) {
        setIsGenerating(false);
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
    const timer = window.setInterval(() => {
      const cached = readLessonAiPreview<string[]>(
        lesson.id,
        LESSON_AI_PREVIEW_KINDS.STORY_ORDER,
      );
      if (!cached?.length) return;
      setSentences(applyStoryOrder(cached));
      setIsGenerating(false);
      clearLessonAiPreview(lesson.id, LESSON_AI_PREVIEW_KINDS.STORY_ORDER);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating, lesson.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    clearLessonAiPreview(lesson.id, LESSON_AI_PREVIEW_KINDS.STORY_ORDER);
    const result = await Admin.LessonController.createStoryOrder(lesson.id);
    if (!result.success) {
      setIsGenerating(false);
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
      <div className="space-y-4">
        {isGenerating ? (
          <p className="text-body-s font-medium text-primary">
            {t(AppLocales.Admin.Lessons.Ai.Pending)}
          </p>
        ) : null}
        <TextArea
          label={t(AppLocales.Admin.Lessons.StoryOrder.SentencesLabel)}
          helperText={t(AppLocales.Admin.Lessons.StoryOrder.SentencesHelper)}
          value={sentences}
          onChange={(e) => setSentences(e.target.value)}
          rows={6}
          disabled={isGenerating}
        />
      </div>
    </DetailSection>
  );
};
