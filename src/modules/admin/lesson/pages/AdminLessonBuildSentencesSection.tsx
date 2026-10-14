import React, { useEffect, useRef, useState } from "react";
import { iconsLib } from "../../../../assets";
import {
  Button,
  DetailSection,
  Dialog,
  TextInput,
} from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import SocketService, {
  type ISocketMessage,
} from "../../../../services/socket.service";
import { NOTIFICATION_SOCKET_TYPES } from "../../../notification/constants";
import { ConfirmDialog } from "../../components";
import { Admin } from "../..";
import {
  clearLessonAiPreview,
  LESSON_AI_PREVIEW_KINDS,
  parseLessonAiSocketMessage,
  readLessonAiPreview,
} from "../../../../helpers/lessonAiSocket";
import type {
  IAdminLesson,
  IAdminLessonBuildSentencePair,
} from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

export const AdminLessonBuildSentencesSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  toastRef.current = toast;
  tRef.current = t;

  const [pairs, setPairs] = useState(lesson.build_the_sentences);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [sentence, setSentence] = useState("");
  const [sentenceError, setSentenceError] = useState("");
  const [isClearOpen, setIsClearOpen] = useState(false);

  useEffect(() => {
    setPairs(lesson.build_the_sentences);
  }, [lesson.build_the_sentences]);

  const syncPairs = async (next: IAdminLessonBuildSentencePair[]) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      build_the_sentences: next,
    });
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return false;
    }
    onLessonChange();
    return true;
  };

  useEffect(() => {
    const applyGenerated = async (next: IAdminLessonBuildSentencePair[]) => {
      setIsGenerating(false);
      clearLessonAiPreview(
        lesson.id,
        LESSON_AI_PREVIEW_KINDS.BUILD_THE_SENTENCES,
      );
      const ok = await syncPairs(next);
      if (!ok) return;
      toastRef.current.success(
        tRef.current(
          AppLocales.Admin.Lessons.BuildSentences.Toasts.GenerateSuccess,
        ),
      );
    };

    const handler = (message: ISocketMessage) => {
      const data = parseLessonAiSocketMessage(message, lesson.id);
      if (!data) return;

      if (
        data.type ===
        NOTIFICATION_SOCKET_TYPES.LESSON_BUILD_THE_SENTENCES_GENERATED
      ) {
        void applyGenerated(data.build_the_sentences ?? []);
      }
      if (
        data.type ===
        NOTIFICATION_SOCKET_TYPES.LESSON_BUILD_THE_SENTENCES_FAILED
      ) {
        setIsGenerating(false);
        toastRef.current.error(
          data.error ||
            tRef.current(
              AppLocales.Admin.Lessons.BuildSentences.Errors.Generate,
            ),
        );
      }
    };

    SocketService.addListener(handler);
    return () => SocketService.removeListener(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(() => {
      const cached = readLessonAiPreview<IAdminLessonBuildSentencePair[]>(
        lesson.id,
        LESSON_AI_PREVIEW_KINDS.BUILD_THE_SENTENCES,
      );
      if (!cached?.length) return;
      setIsGenerating(false);
      clearLessonAiPreview(
        lesson.id,
        LESSON_AI_PREVIEW_KINDS.BUILD_THE_SENTENCES,
      );
      void syncPairs(cached).then((ok) => {
        if (ok) {
          toastRef.current.success(
            tRef.current(
              AppLocales.Admin.Lessons.BuildSentences.Toasts.GenerateSuccess,
            ),
          );
        }
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, lesson.id]);

  const handleGenerate = async () => {
    if (lesson.vocabularies.length === 0) {
      toast.error(t(AppLocales.Admin.Lessons.BuildSentences.Errors.VocabsRequired));
      return;
    }
    setIsGenerating(true);
    clearLessonAiPreview(
      lesson.id,
      LESSON_AI_PREVIEW_KINDS.BUILD_THE_SENTENCES,
    );
    const result =
      await Admin.LessonController.createBuildTheSentences(lesson.id);
    if (!result.success) {
      setIsGenerating(false);
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.AiQueue));
    }
  };

  const handleSaveEdit = async () => {
    if (editIndex === null) return;
    if (!sentence.trim()) {
      setSentenceError(
        t(AppLocales.Admin.Lessons.BuildSentences.Errors.SentenceRequired),
      );
      return;
    }
    const next = pairs.map((pair, index) =>
      index === editIndex ? { ...pair, sentence: sentence.trim() } : pair,
    );
    setIsSaving(true);
    const ok = await syncPairs(next);
    setIsSaving(false);
    if (!ok) return;
    toast.success(
      t(AppLocales.Admin.Lessons.BuildSentences.Toasts.UpdateSuccess),
    );
    setEditIndex(null);
  };

  const handleClear = async () => {
    setIsSaving(true);
    const ok = await syncPairs([]);
    setIsSaving(false);
    setIsClearOpen(false);
    if (!ok) return;
    toast.success(
      t(AppLocales.Admin.Lessons.BuildSentences.Toasts.DeleteSuccess),
    );
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.BuildSentences.Title)}
        description={t(AppLocales.Admin.Lessons.BuildSentences.Description)}
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
              {t(AppLocales.Admin.Lessons.BuildSentences.GenerateButton)}
            </Button>
            {pairs.length > 0 ? (
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                className="text-error"
                onClick={() => setIsClearOpen(true)}
              >
                {t(AppLocales.Admin.Lessons.BuildSentences.ClearButton)}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          {isGenerating ? (
            <p className="text-body-s font-medium text-primary">
              {t(AppLocales.Admin.Lessons.Ai.Pending)}
            </p>
          ) : null}
          {pairs.length === 0 ? (
            <p className="text-body-s text-base-content/60 py-4 text-center">
              {t(AppLocales.Admin.Lessons.BuildSentences.Empty)}
            </p>
          ) : (
            <ul className="space-y-3">
              {pairs.map((item, index) => (
                <li
                  key={`${item.vocab}-${index}`}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.vocab}</p>
                    <p className="text-body-s text-base-content/80">
                      {item.sentence}
                    </p>
                  </div>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => {
                      setEditIndex(index);
                      setSentence(item.sentence);
                      setSentenceError("");
                    }}
                  >
                    <iconsLib.pencilSquare className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={editIndex !== null}
        onClose={() => setEditIndex(null)}
        title={t(AppLocales.Admin.Lessons.BuildSentences.EditTitle)}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={() => setEditIndex(null)}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              isLoading={isSaving}
            >
              {t(AppLocales.Admin.Lessons.BuildSentences.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editIndex !== null ? (
            <p className="text-body-s">
              <span className="font-medium">
                {t(AppLocales.Admin.Lessons.BuildSentences.VocabLabel)}:
              </span>{" "}
              {pairs[editIndex]?.vocab}
            </p>
          ) : null}
          <TextInput
            label={t(AppLocales.Admin.Lessons.BuildSentences.SentenceLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.BuildSentences.SentencePlaceholder,
            )}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            error={sentenceError}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isClearOpen}
        title={t(AppLocales.Admin.Lessons.BuildSentences.Confirm.DeleteTitle)}
        message={t(
          AppLocales.Admin.Lessons.BuildSentences.Confirm.DeleteMessage,
        )}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleClear()}
        onClose={() => setIsClearOpen(false)}
      />
    </>
  );
};
