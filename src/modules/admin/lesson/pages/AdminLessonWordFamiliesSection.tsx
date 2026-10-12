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
import { MOCK_LESSON_WORD_FAMILY_AI_PROFILES } from "../constants";
import {
  clearLessonWordFamilySet,
  generateMockLessonWordFamilies,
  updateLessonWordFamily,
} from "../lesson.mock.store";
import type {
  IAdminLessonStoryVideo,
  IAdminLessonWordFamily,
  IAdminLessonWordFamilySet,
} from "../types";

interface IAdminLessonWordFamiliesSectionProps {
  lessonId: string;
  storyVideo: IAdminLessonStoryVideo | null;
  wordFamilySet: IAdminLessonWordFamilySet | null;
  onWordFamiliesChange: () => void;
}

export const AdminLessonWordFamiliesSection: React.FC<
  IAdminLessonWordFamiliesSectionProps
> = ({ lessonId, wordFamilySet, onWordFamiliesChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [aiProfileId, setAiProfileId] = useState(
    MOCK_LESSON_WORD_FAMILY_AI_PROFILES[0]?.id ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingFamily, setEditingFamily] =
    useState<IAdminLessonWordFamily | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editWords, setEditWords] = useState<string[]>([]);
  const [titleError, setTitleError] = useState("");
  const [wordsError, setWordsError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (wordFamilySet?.aiProfileId) {
      setAiProfileId(wordFamilySet.aiProfileId);
    }
  }, [wordFamilySet?.aiProfileId]);

  const profileOptions = MOCK_LESSON_WORD_FAMILY_AI_PROFILES.map((profile) => ({
    value: profile.id,
    label: profile.name,
  }));

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateMockLessonWordFamilies(lessonId, {
      aiProfileId,
    });
    setIsGenerating(false);

    if (!result.success) {
      if (result.error === "profile_required") {
        toast.error(
          t(AppLocales.Admin.Lessons.WordFamilies.Errors.ProfileRequired),
        );
      } else {
        toast.error(t(AppLocales.Admin.Lessons.WordFamilies.Errors.Generate));
      }
      return;
    }

    toast.success(
      t(AppLocales.Admin.Lessons.WordFamilies.Toasts.GenerateSuccess),
    );
    onWordFamiliesChange();
  };

  const openEdit = (family: IAdminLessonWordFamily) => {
    setEditingFamily(family);
    setEditTitle(family.title);
    setEditWords(family.words.length > 0 ? [...family.words] : [""]);
    setTitleError("");
    setWordsError("");
  };

  const closeEdit = () => {
    setEditingFamily(null);
    setEditTitle("");
    setEditWords([]);
    setTitleError("");
    setWordsError("");
  };

  const updateWordAt = (index: number, value: string) => {
    setEditWords((current) =>
      current.map((word, i) => (i === index ? value : word)),
    );
  };

  const addWordField = () => {
    setEditWords((current) => [...current, ""]);
  };

  const removeWordAt = (index: number) => {
    setEditWords((current) => {
      if (current.length <= 1) return [""];
      return current.filter((_, i) => i !== index);
    });
  };

  const handleSaveEdit = () => {
    if (!editingFamily) return;

    const title = editTitle.trim();
    const words = editWords.map((word) => word.trim()).filter(Boolean);

    let hasError = false;
    if (!title) {
      setTitleError(t(AppLocales.Admin.Lessons.WordFamilies.Errors.TitleRequired));
      hasError = true;
    } else {
      setTitleError("");
    }
    if (words.length === 0) {
      setWordsError(t(AppLocales.Admin.Lessons.WordFamilies.Errors.WordsRequired));
      hasError = true;
    } else {
      setWordsError("");
    }
    if (hasError) return;

    setIsSaving(true);
    const updated = updateLessonWordFamily(lessonId, editingFamily.id, {
      title,
      words,
    });
    setIsSaving(false);

    if (!updated) {
      toast.error(t(AppLocales.Admin.Lessons.WordFamilies.Errors.Update));
      return;
    }

    toast.success(t(AppLocales.Admin.Lessons.WordFamilies.Toasts.UpdateSuccess));
    closeEdit();
    onWordFamiliesChange();
  };

  const handleClear = () => {
    const ok = clearLessonWordFamilySet(lessonId);
    setIsDeleteOpen(false);
    if (ok) {
      toast.success(
        t(AppLocales.Admin.Lessons.WordFamilies.Toasts.DeleteSuccess),
      );
      onWordFamiliesChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.WordFamilies.Errors.Delete));
    }
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.WordFamilies.Title)}
        description={t(AppLocales.Admin.Lessons.WordFamilies.Description)}
        icon={iconsLib.sparkles}
        badge={
          <Badge variant={BadgeVariants.WARNING} size={ComponentSizes.SM}>
            {t(AppLocales.Admin.Lessons.WordFamilies.PlaceholderBadge)}
          </Badge>
        }
      >
        <div className="space-y-6">
          {!wordFamilySet ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <p className="text-body-s text-base-content/70">
                {t(AppLocales.Admin.Lessons.WordFamilies.GenerateHint)}
              </p>
              <div className="grid gap-4 lg:grid-cols-[minmax(12rem,16rem)_auto] lg:items-end">
                <Dropdown
                  label={t(AppLocales.Admin.Lessons.WordFamilies.ProfileLabel)}
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
                  {t(AppLocales.Admin.Lessons.WordFamilies.GenerateButton)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-caption text-base-content/60">
                    {wordFamilySet.aiProfileName}
                    {" · "}
                    <DateTime
                      value={wordFamilySet.createdAt}
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
                    {t(AppLocales.Admin.Lessons.WordFamilies.RegenerateButton)}
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

              <div className="grid gap-4 md:grid-cols-2">
                {wordFamilySet.families.map((family) => (
                  <div
                    key={family.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body-m font-semibold text-base-content">
                        {family.title}
                      </p>
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        onClick={() => openEdit(family)}
                      >
                        <iconsLib.pencilSquare className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-1 text-body-s text-base-content/80">
                      {family.words.map((word) => (
                        <li key={`${family.id}-${word}`} className="flex gap-2">
                          <span className="text-base-content/40">•</span>
                          <span>{word}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={Boolean(editingFamily)}
        onClose={closeEdit}
        title={t(AppLocales.Admin.Lessons.WordFamilies.EditTitle)}
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
              {t(AppLocales.Admin.Lessons.WordFamilies.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextInput
            label={t(AppLocales.Admin.Lessons.WordFamilies.TitleLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.WordFamilies.TitlePlaceholder,
            )}
            value={editTitle}
            error={titleError}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-body-s font-medium text-base-content">
                {t(AppLocales.Admin.Lessons.WordFamilies.WordsLabel)}
              </p>
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                onClick={addWordField}
              >
                <iconsLib.plus className="mr-1 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.WordFamilies.AddWord)}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {editWords.map((word, index) => (
                <div key={`word-${index}`} className="flex items-center gap-2">
                  <TextInput
                    placeholder={t(
                      AppLocales.Admin.Lessons.WordFamilies.WordsPlaceholder,
                    )}
                    value={word}
                    onChange={(e) => updateWordAt(index, e.target.value)}
                  />
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    className="shrink-0 h-10 w-10 p-0 border border-error/30 text-error hover:bg-error/10"
                    aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                    onClick={() => removeWordAt(index)}
                    disabled={editWords.length <= 1}
                  >
                    <iconsLib.trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {wordsError ? (
              <p className="text-caption text-error">{wordsError}</p>
            ) : null}
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t(AppLocales.Admin.Lessons.WordFamilies.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.WordFamilies.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleClear}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
