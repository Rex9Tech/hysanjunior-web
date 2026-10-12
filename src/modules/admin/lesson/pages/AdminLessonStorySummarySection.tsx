import React, { useEffect, useState } from "react";
import { iconsLib } from "../../../../assets";
import {
  Badge,
  Button,
  DateTime,
  DateTimeFormats,
  DetailSection,
  Dialog,
  TextInput,
} from "../../../../design";
import {
  BadgeVariants,
  ButtonSizes,
  ButtonVariants,
  ComponentSizes,
} from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import { ConfirmDialog, Dropdown } from "../../components";
import { MOCK_LESSON_STORY_SUMMARY_AI_PROFILES } from "../constants";
import {
  clearLessonStorySummary,
  generateMockLessonStorySummary,
  updateLessonStorySummary,
} from "../lesson.mock.store";
import type { IAdminLessonStorySummary } from "../types";

interface IAdminLessonStorySummarySectionProps {
  lessonId: string;
  storySummary: IAdminLessonStorySummary | null;
  onStorySummaryChange: () => void;
}

export const AdminLessonStorySummarySection: React.FC<
  IAdminLessonStorySummarySectionProps
> = ({ lessonId, storySummary, onStorySummaryChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [aiProfileId, setAiProfileId] = useState(
    MOCK_LESSON_STORY_SUMMARY_AI_PROFILES[0]?.id ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSentences, setEditSentences] = useState<string[]>([]);
  const [sentencesError, setSentencesError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storySummary?.aiProfileId) {
      setAiProfileId(storySummary.aiProfileId);
    }
  }, [storySummary?.aiProfileId]);

  const profileOptions = MOCK_LESSON_STORY_SUMMARY_AI_PROFILES.map(
    (profile) => ({
      value: profile.id,
      label: profile.name,
    }),
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateMockLessonStorySummary(lessonId, {
      aiProfileId,
    });
    setIsGenerating(false);

    if (!result.success) {
      if (result.error === "profile_required") {
        toast.error(
          t(AppLocales.Admin.Lessons.StorySummary.Errors.ProfileRequired),
        );
      } else {
        toast.error(t(AppLocales.Admin.Lessons.StorySummary.Errors.Generate));
      }
      return;
    }

    toast.success(
      t(AppLocales.Admin.Lessons.StorySummary.Toasts.GenerateSuccess),
    );
    onStorySummaryChange();
  };

  const openEdit = () => {
    if (!storySummary) return;
    setEditSentences(
      storySummary.sentences.length > 0 ? [...storySummary.sentences] : [""],
    );
    setSentencesError("");
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditSentences([]);
    setSentencesError("");
  };

  const updateSentenceAt = (index: number, value: string) => {
    setEditSentences((current) =>
      current.map((sentence, i) => (i === index ? value : sentence)),
    );
  };

  const addSentenceField = () => {
    setEditSentences((current) => [...current, ""]);
  };

  const removeSentenceAt = (index: number) => {
    setEditSentences((current) => {
      if (current.length <= 1) return [""];
      return current.filter((_, i) => i !== index);
    });
  };

  const handleSaveEdit = () => {
    const sentences = editSentences.map((s) => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      setSentencesError(
        t(AppLocales.Admin.Lessons.StorySummary.Errors.SentencesRequired),
      );
      return;
    }
    setSentencesError("");

    setIsSaving(true);
    const updated = updateLessonStorySummary(lessonId, { sentences });
    setIsSaving(false);

    if (!updated) {
      toast.error(t(AppLocales.Admin.Lessons.StorySummary.Errors.Update));
      return;
    }

    toast.success(
      t(AppLocales.Admin.Lessons.StorySummary.Toasts.UpdateSuccess),
    );
    closeEdit();
    onStorySummaryChange();
  };

  const handleClear = () => {
    const ok = clearLessonStorySummary(lessonId);
    setIsDeleteOpen(false);
    if (ok) {
      toast.success(
        t(AppLocales.Admin.Lessons.StorySummary.Toasts.DeleteSuccess),
      );
      onStorySummaryChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.StorySummary.Errors.Delete));
    }
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.StorySummary.Title)}
        description={t(AppLocales.Admin.Lessons.StorySummary.Description)}
        icon={iconsLib.sparkles}
        badge={
          <Badge variant={BadgeVariants.WARNING} size={ComponentSizes.SM}>
            {t(AppLocales.Admin.Lessons.StorySummary.PlaceholderBadge)}
          </Badge>
        }
      >
        <div className="space-y-6">
          {!storySummary ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <p className="text-body-s text-base-content/70">
                {t(AppLocales.Admin.Lessons.StorySummary.GenerateHint)}
              </p>
              <div className="grid gap-4 lg:grid-cols-[minmax(12rem,16rem)_auto] lg:items-end">
                <Dropdown
                  label={t(AppLocales.Admin.Lessons.StorySummary.ProfileLabel)}
                  value={aiProfileId}
                  onValueChange={setAiProfileId}
                  options={profileOptions}
                />
                <Button
                  className="lg:mb-1"
                  onClick={() => void handleGenerate()}
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  <iconsLib.sparkles className="mr-2 h-4 w-4 text-secondary-content" />
                  {t(AppLocales.Admin.Lessons.StorySummary.GenerateButton)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-caption text-base-content/60">
                    {storySummary.aiProfileName}
                    {" · "}
                    <DateTime
                      value={storySummary.createdAt}
                      format={DateTimeFormats.ADMIN}
                    />
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Dropdown
                    className="min-w-[12rem]"
                    value={aiProfileId}
                    onValueChange={setAiProfileId}
                    options={profileOptions}
                  />
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.SECONDARY}
                    onClick={() => void handleGenerate()}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                  >
                    {t(AppLocales.Admin.Lessons.StorySummary.RegenerateButton)}
                  </Button>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    onClick={openEdit}
                  >
                    <iconsLib.pencilSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    className="border border-error/30 text-error hover:bg-error/10"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <iconsLib.trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ol className="space-y-2 rounded-xl border border-base-300 bg-base-100 p-4 list-decimal list-inside text-body-s text-base-content/90">
                {storySummary.sentences.map((sentence, index) => (
                  <li key={`summary-${index}`} className="leading-relaxed">
                    {sentence}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={isEditOpen}
        onClose={closeEdit}
        title={t(AppLocales.Admin.Lessons.StorySummary.EditTitle)}
        className="max-w-lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={closeEdit}
              disabled={isSaving}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {t(AppLocales.Admin.Lessons.StorySummary.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-body-s font-medium text-base-content">
              {t(AppLocales.Admin.Lessons.StorySummary.SentencesLabel)}
            </p>
            <Button
              size={ButtonSizes.SM}
              variant={ButtonVariants.TERTIARY}
              onClick={addSentenceField}
            >
              <iconsLib.plus className="mr-1 h-4 w-4" />
              {t(AppLocales.Admin.Lessons.StorySummary.AddSentence)}
            </Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {editSentences.map((sentence, index) => (
              <div key={`sentence-${index}`} className="flex items-start gap-2">
                <span className="mt-3 text-caption text-base-content/50 w-5 shrink-0">
                  {index + 1}.
                </span>
                <TextInput
                  placeholder={t(
                    AppLocales.Admin.Lessons.StorySummary.SentencePlaceholder,
                  )}
                  value={sentence}
                  onChange={(e) => updateSentenceAt(index, e.target.value)}
                />
                <Button
                  size={ButtonSizes.SM}
                  variant={ButtonVariants.TERTIARY}
                  className="shrink-0 h-10 w-10 p-0 border border-error/30 text-error hover:bg-error/10"
                  aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                  onClick={() => removeSentenceAt(index)}
                  disabled={editSentences.length <= 1}
                >
                  <iconsLib.trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {sentencesError ? (
            <p className="text-caption text-error">{sentencesError}</p>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t(AppLocales.Admin.Lessons.StorySummary.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.StorySummary.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleClear}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
