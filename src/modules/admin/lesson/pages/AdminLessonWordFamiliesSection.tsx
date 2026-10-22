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
  clearLessonAiGenerating,
  finishLessonAiGenerating,
  isLessonAiGenerating,
  LESSON_AI_PREVIEW_KINDS,
  markLessonAiGenerating,
  parseLessonAiSocketMessage,
  readLessonAiPreview,
} from "../../../../helpers/lessonAiSocket";
import type {
  IAdminLesson,
  IAdminLessonWordFamily,
  IAdminLessonWordFamilyWrite,
} from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

const KIND = LESSON_AI_PREVIEW_KINDS.WORD_FAMILIES;

type TFamilyDraft = {
  key: string;
  id?: string;
  pattern: string;
  wordsText: string;
};

const toDrafts = (items: IAdminLessonWordFamily[]): TFamilyDraft[] =>
  items.map((item, index) => ({
    key: item.id || `family-${index}`,
    id: item.id,
    pattern: item.pattern,
    wordsText: item.words.join(", "),
  }));

const parseWords = (value: string): string[] =>
  value
    .split(/[,|\n]/)
    .map((word) => word.trim())
    .filter(Boolean);

const toWritePayload = (drafts: TFamilyDraft[]): IAdminLessonWordFamilyWrite[] =>
  drafts
    .map((draft) => ({
      id: draft.id,
      pattern: draft.pattern.trim(),
      words: parseWords(draft.wordsText),
    }))
    .filter((item) => item.pattern && item.words.length > 0);

export const AdminLessonWordFamiliesSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  const onLessonChangeRef = useRef(onLessonChange);
  toastRef.current = toast;
  tRef.current = t;
  onLessonChangeRef.current = onLessonChange;

  const [drafts, setDrafts] = useState<TFamilyDraft[]>(() =>
    toDrafts(lesson.word_families),
  );
  const [isGenerating, setIsGenerating] = useState(() =>
    isLessonAiGenerating(lesson.id, KIND),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const [newWords, setNewWords] = useState("");
  const [patternError, setPatternError] = useState("");
  const [wordsError, setWordsError] = useState("");

  useEffect(() => {
    if (isLessonAiGenerating(lesson.id, KIND)) {
      setIsGenerating(true);
    }
  }, [lesson.id]);

  useEffect(() => {
    if (isGenerating) return;
    setDrafts(toDrafts(lesson.word_families));
  }, [lesson.word_families, isGenerating]);

  const persist = async (next: IAdminLessonWordFamilyWrite[]) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      word_families: next,
    });
    if (!result.success) {
      toastRef.current.error(
        result.error ||
          tRef.current(AppLocales.Admin.Lessons.Errors.Update),
      );
      return false;
    }
    onLessonChangeRef.current();
    return true;
  };

  const applyGenerated = (
    items: Array<{ pattern: string; words: string[] }>,
  ) => {
    if (!items.length) return;

    setDrafts(
      items.map((item, index) => ({
        key: `generated-${index}-${item.pattern}`,
        pattern: item.pattern,
        wordsText: item.words.join(", "),
      })),
    );
    setIsGenerating(false);
    finishLessonAiGenerating(lesson.id, KIND);
    toastRef.current.success(
      tRef.current(
        AppLocales.Admin.Lessons.WordFamilies.Toasts.GenerateSuccess,
      ),
    );
  };

  useEffect(() => {
    const handler = (message: ISocketMessage) => {
      const data = parseLessonAiSocketMessage(message, lesson.id);
      if (!data) return;

      if (
        data.type === NOTIFICATION_SOCKET_TYPES.LESSON_WORD_FAMILIES_GENERATED
      ) {
        applyGenerated(data.word_families ?? []);
      }

      if (data.type === NOTIFICATION_SOCKET_TYPES.LESSON_WORD_FAMILIES_FAILED) {
        setIsGenerating(false);
        clearLessonAiGenerating(lesson.id, KIND);
        toastRef.current.error(
          data.error ||
            tRef.current(
              AppLocales.Admin.Lessons.WordFamilies.Errors.Generate,
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

    const applyCached = () => {
      if (!isLessonAiGenerating(lesson.id, KIND)) return;
      const cached = readLessonAiPreview<
        Array<{ pattern: string; words: string[] }>
      >(lesson.id, KIND);
      if (!cached?.length) return;
      applyGenerated(cached);
    };

    applyCached();
    const timer = window.setInterval(applyCached, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, lesson.id]);

  const handleGenerate = async () => {
    markLessonAiGenerating(lesson.id, KIND);
    setIsGenerating(true);
    const result = await Admin.LessonController.createWordFamilies(lesson.id);
    if (!result.success) {
      setIsGenerating(false);
      clearLessonAiGenerating(lesson.id, KIND);
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.AiQueue));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await persist(toWritePayload(drafts));
    setIsSaving(false);
    if (!ok) return;
    toast.success(t(AppLocales.Admin.Lessons.WordFamilies.Toasts.UpdateSuccess));
  };

  const handleAdd = async () => {
    let valid = true;
    if (!newPattern.trim()) {
      setPatternError(
        t(AppLocales.Admin.Lessons.WordFamilies.Errors.PatternRequired),
      );
      valid = false;
    } else setPatternError("");
    if (parseWords(newWords).length === 0) {
      setWordsError(
        t(AppLocales.Admin.Lessons.WordFamilies.Errors.WordsRequired),
      );
      valid = false;
    } else setWordsError("");
    if (!valid) return;

    const next = [
      ...drafts,
      {
        key: `new-${Date.now()}`,
        pattern: newPattern.trim(),
        wordsText: newWords,
      },
    ];
    setDrafts(next);
    setIsAddOpen(false);
    setNewPattern("");
    setNewWords("");

    setIsSaving(true);
    const ok = await persist(toWritePayload(next));
    setIsSaving(false);
    if (!ok) return;
    toast.success(t(AppLocales.Admin.Lessons.WordFamilies.Toasts.UpdateSuccess));
  };

  const handleDeleteOne = async (key: string) => {
    const next = drafts.filter((draft) => draft.key !== key);
    setDrafts(next);
    setIsSaving(true);
    const ok = await persist(toWritePayload(next));
    setIsSaving(false);
    if (!ok) return;
    toast.success(t(AppLocales.Admin.Lessons.WordFamilies.Toasts.DeleteSuccess));
  };

  const handleClear = async () => {
    setIsSaving(true);
    const ok = await persist([]);
    setIsSaving(false);
    setIsClearOpen(false);
    if (!ok) return;
    setDrafts([]);
    toast.success(t(AppLocales.Admin.Lessons.WordFamilies.Toasts.DeleteSuccess));
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.WordFamilies.Title)}
        description={t(AppLocales.Admin.Lessons.WordFamilies.Description)}
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
              {t(AppLocales.Admin.Lessons.WordFamilies.GenerateButton)}
            </Button>
            <Button
              size={ButtonSizes.SM}
              onClick={() => setIsAddOpen(true)}
              disabled={isGenerating}
            >
              <iconsLib.plus className="mr-1.5 h-4 w-4 text-secondary-content" />
           
              {t(AppLocales.Admin.Lessons.WordFamilies.AddButton)}
            </Button>
            <Button
              size={ButtonSizes.SM}
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={isSaving || isGenerating}
            >
              {t(AppLocales.Admin.Lessons.WordFamilies.SaveButton)}
            </Button>
            {drafts.length > 0 ? (
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.FLAT}
                className="text-error"
                onClick={() => setIsClearOpen(true)}
                disabled={isGenerating}
              >
                {t(AppLocales.Admin.Lessons.WordFamilies.ClearButton)}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          {drafts.length === 0 ? (
            isGenerating ? (
              <TextInput
                label={t(AppLocales.Admin.Lessons.WordFamilies.PatternLabel)}
                value={t(AppLocales.Admin.Lessons.Ai.Pending)}
                readOnly
              />
            ) : (
              <p className="text-body-s text-base-content/60 py-4 text-center">
                {t(AppLocales.Admin.Lessons.WordFamilies.Empty)}
              </p>
            )
          ) : (
            <ul className="space-y-4">
              {drafts.map((draft) => (
                <li
                  key={draft.key}
                  className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3"
                >
                  <TextInput
                    label={t(
                      AppLocales.Admin.Lessons.WordFamilies.PatternLabel,
                    )}
                    value={
                      isGenerating
                        ? t(AppLocales.Admin.Lessons.Ai.Pending)
                        : draft.pattern
                    }
                    readOnly={isGenerating}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDrafts((current) =>
                        current.map((item) =>
                          item.key === draft.key
                            ? { ...item, pattern: value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <TextInput
                    label={t(AppLocales.Admin.Lessons.WordFamilies.WordsLabel)}
                    value={
                      isGenerating
                        ? t(AppLocales.Admin.Lessons.Ai.Pending)
                        : draft.wordsText
                    }
                    helperText={t(
                      AppLocales.Admin.Lessons.WordFamilies.WordsHelper,
                    )}
                    readOnly={isGenerating}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDrafts((current) =>
                        current.map((item) =>
                          item.key === draft.key
                            ? { ...item, wordsText: value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.FLAT}
                      className="text-error"
                      disabled={isGenerating}
                      onClick={() => void handleDeleteOne(draft.key)}
                    >
                      <iconsLib.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t(AppLocales.Admin.Lessons.WordFamilies.AddTitle)}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant={ButtonVariants.FLAT}
              onClick={() => setIsAddOpen(false)}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button onClick={() => void handleAdd()} isLoading={isSaving}>
              {t(AppLocales.Admin.Lessons.WordFamilies.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextInput
            label={t(AppLocales.Admin.Lessons.WordFamilies.PatternLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.WordFamilies.PatternPlaceholder,
            )}
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            error={patternError}
          />
          <TextInput
            label={t(AppLocales.Admin.Lessons.WordFamilies.WordsLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.WordFamilies.WordsPlaceholder,
            )}
            value={newWords}
            onChange={(e) => setNewWords(e.target.value)}
            error={wordsError}
            helperText={t(AppLocales.Admin.Lessons.WordFamilies.WordsHelper)}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isClearOpen}
        title={t(AppLocales.Admin.Lessons.WordFamilies.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.WordFamilies.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleClear()}
        onClose={() => setIsClearOpen(false)}
      />
    </>
  );
};
