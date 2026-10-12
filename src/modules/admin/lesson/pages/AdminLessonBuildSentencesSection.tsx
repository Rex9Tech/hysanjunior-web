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
import { MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES } from "../constants";
import {
  clearLessonBuildSentenceSet,
  generateMockLessonBuildSentences,
  updateLessonBuildSentence,
} from "../lesson.mock.store";
import type {
  IAdminLessonBuildSentenceItem,
  IAdminLessonBuildSentenceSet,
  IAdminLessonStoryVideo,
  IAdminLessonVocabItem,
} from "../types";

interface IAdminLessonBuildSentencesSectionProps {
  lessonId: string;
  vocabs: IAdminLessonVocabItem[];
  storyVideo: IAdminLessonStoryVideo | null;
  buildSentenceSet: IAdminLessonBuildSentenceSet | null;
  onBuildSentencesChange: () => void;
}

export const AdminLessonBuildSentencesSection: React.FC<
  IAdminLessonBuildSentencesSectionProps
> = ({
  lessonId,
  vocabs,
  storyVideo: _storyVideo,
  buildSentenceSet,
  onBuildSentencesChange,
}) => {
  const t = useTranslate();
  const toast = useToast();

  const [aiProfileId, setAiProfileId] = useState(
    MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES[0]?.id ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<IAdminLessonBuildSentenceItem | null>(null);
  const [editSentence, setEditSentence] = useState("");
  const [sentenceError, setSentenceError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (buildSentenceSet?.aiProfileId) {
      setAiProfileId(buildSentenceSet.aiProfileId);
    }
  }, [buildSentenceSet?.aiProfileId]);

  const profileOptions = MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES.map(
    (profile) => ({
      value: profile.id,
      label: profile.name,
    }),
  );

  const handleGenerate = async () => {
    if (vocabs.length === 0) {
      toast.error(
        t(AppLocales.Admin.Lessons.BuildSentences.Errors.VocabsRequired),
      );
      return;
    }

    setIsGenerating(true);
    const result = await generateMockLessonBuildSentences(lessonId, {
      aiProfileId,
    });
    setIsGenerating(false);

    if (!result.success) {
      if (result.error === "vocabs_required") {
        toast.error(
          t(AppLocales.Admin.Lessons.BuildSentences.Errors.VocabsRequired),
        );
      } else if (result.error === "profile_required") {
        toast.error(
          t(AppLocales.Admin.Lessons.BuildSentences.Errors.ProfileRequired),
        );
      } else {
        toast.error(t(AppLocales.Admin.Lessons.BuildSentences.Errors.Generate));
      }
      return;
    }

    toast.success(
      t(AppLocales.Admin.Lessons.BuildSentences.Toasts.GenerateSuccess),
    );
    onBuildSentencesChange();
  };

  const openEdit = (item: IAdminLessonBuildSentenceItem) => {
    setEditingItem(item);
    setEditSentence(item.sentence);
    setSentenceError("");
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditSentence("");
    setSentenceError("");
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const sentence = editSentence.trim();
    if (!sentence) {
      setSentenceError(
        t(AppLocales.Admin.Lessons.BuildSentences.Errors.SentenceRequired),
      );
      return;
    }
    setSentenceError("");

    setIsSaving(true);
    const updated = updateLessonBuildSentence(lessonId, editingItem.id, {
      sentence,
    });
    setIsSaving(false);

    if (!updated) {
      toast.error(t(AppLocales.Admin.Lessons.BuildSentences.Errors.Update));
      return;
    }

    toast.success(
      t(AppLocales.Admin.Lessons.BuildSentences.Toasts.UpdateSuccess),
    );
    closeEdit();
    onBuildSentencesChange();
  };

  const handleClear = () => {
    const ok = clearLessonBuildSentenceSet(lessonId);
    setIsDeleteOpen(false);
    if (ok) {
      toast.success(
        t(AppLocales.Admin.Lessons.BuildSentences.Toasts.DeleteSuccess),
      );
      onBuildSentencesChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.BuildSentences.Errors.Delete));
    }
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.BuildSentences.Title)}
        description={t(AppLocales.Admin.Lessons.BuildSentences.Description)}
        icon={iconsLib.sparkles}
        badge={
          <Badge variant={BadgeVariants.WARNING} size={ComponentSizes.SM}>
            {t(AppLocales.Admin.Lessons.BuildSentences.PlaceholderBadge)}
          </Badge>
        }
      >
        <div className="space-y-6">
          {!buildSentenceSet ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <p className="text-body-s text-base-content/70">
                {t(AppLocales.Admin.Lessons.BuildSentences.GenerateHint)}
              </p>
              <div className="grid gap-4 lg:grid-cols-[minmax(12rem,16rem)_auto] lg:items-end">
                <Dropdown
                  label={t(AppLocales.Admin.Lessons.BuildSentences.ProfileLabel)}
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
                  {t(AppLocales.Admin.Lessons.BuildSentences.GenerateButton)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-caption text-base-content/60">
                    {buildSentenceSet.aiProfileName}
                    {" · "}
                    <DateTime
                      value={buildSentenceSet.createdAt}
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
                    {t(AppLocales.Admin.Lessons.BuildSentences.RegenerateButton)}
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

              <ul className="space-y-3">
                {buildSentenceSet.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-caption font-semibold uppercase tracking-wide text-base-content/50">
                          {t(AppLocales.Admin.Lessons.BuildSentences.VocabLabel)}
                        </p>
                        <p className="text-body-m font-semibold text-base-content">
                          {item.vocab}
                        </p>
                        <p className="text-body-s text-base-content/80 leading-relaxed">
                          {item.sentence}
                        </p>
                      </div>
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        onClick={() => openEdit(item)}
                      >
                        <iconsLib.pencilSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={Boolean(editingItem)}
        onClose={closeEdit}
        title={t(AppLocales.Admin.Lessons.BuildSentences.EditTitle)}
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
              {t(AppLocales.Admin.Lessons.BuildSentences.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-body-s font-medium text-base-content/70 mb-1">
              {t(AppLocales.Admin.Lessons.BuildSentences.VocabLabel)}
            </p>
            <p className="text-body-m font-semibold text-base-content">
              {editingItem?.vocab}
            </p>
          </div>
          <TextInput
            label={t(AppLocales.Admin.Lessons.BuildSentences.SentenceLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.BuildSentences.SentencePlaceholder,
            )}
            value={editSentence}
            error={sentenceError}
            onChange={(e) => setEditSentence(e.target.value)}
            required
          />
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t(AppLocales.Admin.Lessons.BuildSentences.Confirm.DeleteTitle)}
        message={t(
          AppLocales.Admin.Lessons.BuildSentences.Confirm.DeleteMessage,
        )}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleClear}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
