import React, { useEffect, useState } from "react";
import { iconsLib } from "../../../../assets";
import { UPLOAD_SIZE_LIMITS } from "../../../../constants";
import {
  Badge,
  Button,
  Checkbox,
  DetailSection,
  Dialog,
  FileInput,
  Image,
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
import { ConfirmDialog } from "../../components";
import { Admin } from "../..";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import { ASSET_FORMATS, ASSET_TYPES } from "../../asset/constants";
import type { IAdminAsset } from "../../asset/types";
import {
  QUESTION_KINDS,
  type IAdminLesson,
  type IAdminLessonQuestion,
  type IAdminLessonQuestionWrite,
} from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

type TOptionDraft = {
  clientId: string;
  id?: string;
  text: string;
  correct: boolean;
  imageSelection: TImageSelection;
  existingImage: { imageAssetId: string; imageUrl: string } | null;
  textError: string;
};

const newClientId = () =>
  `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const emptyOption = (): TOptionDraft => ({
  clientId: newClientId(),
  text: "",
  correct: false,
  imageSelection: null,
  existingImage: null,
  textError: "",
});

export const AdminLessonQuestionsSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const [questions, setQuestions] = useState(lesson.questions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<IAdminLessonQuestion | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [options, setOptions] = useState<TOptionDraft[]>([
    emptyOption(),
    emptyOption(),
  ]);
  const [pickerOptionId, setPickerOptionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IAdminLessonQuestion | null>(
    null,
  );

  useEffect(() => {
    setQuestions(lesson.questions);
  }, [lesson.questions]);

  const revoke = (option: TOptionDraft) => {
    if (option.imageSelection?.source === "upload") {
      URL.revokeObjectURL(option.imageSelection.previewUrl);
    }
  };

  const resetForm = () => {
    options.forEach(revoke);
    setEditing(null);
    setTitle("");
    setTitleError("");
    setOptionsError("");
    setOptions([emptyOption(), emptyOption()]);
    setPickerOptionId(null);
  };

  const closeForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item: IAdminLessonQuestion) => {
    options.forEach(revoke);
    setEditing(item);
    setTitle(item.title);
    setTitleError("");
    setOptionsError("");
    setOptions(
      item.options.map((option) => ({
        clientId: option.id,
        id: option.id,
        text: option.text,
        correct: option.correct,
        imageSelection: null,
        existingImage:
          option.image_asset_id && option.image?.url
            ? {
                imageAssetId: option.image_asset_id,
                imageUrl: option.image.url,
              }
            : null,
        textError: "",
      })),
    );
    setIsFormOpen(true);
  };

  const updateOption = (clientId: string, patch: Partial<TOptionDraft>) => {
    setOptions((current) =>
      current.map((option) =>
        option.clientId === clientId ? { ...option, ...patch } : option,
      ),
    );
  };

  const resolveImageAssetId = async (
    option: TOptionDraft,
  ): Promise<string | null> => {
    if (option.imageSelection?.source === "pick") {
      return option.imageSelection.asset.id;
    }
    if (option.imageSelection?.source === "upload") {
      const uploadResult = await Admin.AssetController.uploadAsset(
        option.imageSelection.file,
        {
          type: ASSET_TYPES.GENERAL,
          title: option.imageSelection.file.name.replace(/\.[^.]+$/, ""),
        },
      );
      if (!uploadResult.success || !uploadResult.asset) {
        toast.error(
          uploadResult.error ||
            t(AppLocales.Admin.Lessons.Questions.Errors.UploadImage),
        );
        return null;
      }
      return uploadResult.asset.id;
    }
    return option.existingImage?.imageAssetId ?? null;
  };

  const toWrite = (
    list: IAdminLessonQuestion[],
  ): IAdminLessonQuestionWrite[] =>
    list.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      options: item.options.map((option) => ({
        id: option.id,
        text: option.text,
        correct: option.correct,
        image_asset_id: option.image_asset_id,
      })),
    }));

  const syncQuestions = async (next: IAdminLessonQuestionWrite[]) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      questions: next,
    });
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return false;
    }
    onLessonChange();
    return true;
  };

  const handleSave = async () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError(t(AppLocales.Admin.Lessons.Questions.Errors.TitleRequired));
      valid = false;
    } else setTitleError("");

    if (options.length < 2) {
      setOptionsError(t(AppLocales.Admin.Lessons.Questions.Errors.OptionsMin));
      valid = false;
    } else setOptionsError("");

    const nextOptions = options.map((option) => {
      if (!option.text.trim()) {
        valid = false;
        return {
          ...option,
          textError: t(
            AppLocales.Admin.Lessons.Questions.Errors.OptionTextRequired,
          ),
        };
      }
      return { ...option, textError: "" };
    });
    setOptions(nextOptions);

    if (!nextOptions.some((option) => option.correct)) {
      setOptionsError(
        t(AppLocales.Admin.Lessons.Questions.Errors.CorrectRequired),
      );
      valid = false;
    }

    if (!valid) return;

    setIsSaving(true);
    const resolved: IAdminLessonQuestionWrite["options"] = [];
    for (const option of nextOptions) {
      const imageAssetId = await resolveImageAssetId(option);
      resolved.push({
        id: option.id,
        text: option.text.trim(),
        correct: option.correct,
        image_asset_id: imageAssetId,
      });
    }

    const entry: IAdminLessonQuestionWrite = {
      id: editing?.id,
      title: title.trim(),
      kind: QUESTION_KINDS.MULTIPLE_CHOICE,
      options: resolved,
    };

    const next = editing
      ? toWrite(questions).map((item) =>
          item.id === editing.id ? entry : item,
        )
      : [...toWrite(questions), entry];

    const ok = await syncQuestions(next);
    setIsSaving(false);
    if (!ok) return;
    toast.success(
      editing
        ? t(AppLocales.Admin.Lessons.Questions.Toasts.UpdateSuccess)
        : t(AppLocales.Admin.Lessons.Questions.Toasts.CreateSuccess),
    );
    closeForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    const ok = await syncQuestions(
      toWrite(questions.filter((item) => item.id !== deleteTarget.id)),
    );
    setIsSaving(false);
    setDeleteTarget(null);
    if (!ok) return;
    toast.success(t(AppLocales.Admin.Lessons.Questions.Toasts.DeleteSuccess));
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.Questions.Title)}
        description={t(AppLocales.Admin.Lessons.Questions.Description)}
        icon={iconsLib.document}
        actions={
          <Button size={ButtonSizes.SM} onClick={openAdd}>
            <iconsLib.plus className="mr-1.5 h-4 w-4 text-secondary-content" />
            {t(AppLocales.Admin.Lessons.Questions.AddButton)}
          </Button>
        }
      >
        {questions.length === 0 ? (
          <p className="text-body-s text-base-content/60 py-4 text-center">
            {t(AppLocales.Admin.Lessons.Questions.Empty)}
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-caption text-base-content/60">
                      {t(AppLocales.Admin.Lessons.Questions.OptionsCount, {
                        count: item.options.length,
                      })}{" "}
                      ·{" "}
                      {t(AppLocales.Admin.Lessons.Questions.CorrectCount, {
                        count: item.options.filter((o) => o.correct).length,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      onClick={() => openEdit(item)}
                    >
                      <iconsLib.pencilSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="text-error"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <iconsLib.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ul className="space-y-1">
                  {item.options.map((option) => (
                    <li
                      key={option.id}
                      className="flex items-center gap-2 text-body-s"
                    >
                      {option.image?.url ? (
                        <Image
                          src={option.image.url}
                          alt=""
                          className="h-8 w-8 rounded object-cover border border-base-300"
                        />
                      ) : null}
                      <span>{option.text}</span>
                      {option.correct ? (
                        <Badge
                          variant={BadgeVariants.SUCCESS}
                          size={ComponentSizes.SM}
                        >
                          {t(AppLocales.Admin.Lessons.Questions.CorrectBadge)}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editing
            ? t(AppLocales.Admin.Lessons.Questions.EditTitle)
            : t(AppLocales.Admin.Lessons.Questions.AddTitle)
        }
        className="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant={ButtonVariants.TERTIARY} onClick={closeForm}>
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {t(AppLocales.Admin.Lessons.Questions.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <TextInput
            label={t(AppLocales.Admin.Lessons.Questions.TitleLabel)}
            placeholder={t(AppLocales.Admin.Lessons.Questions.TitlePlaceholder)}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={titleError}
            required
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body-s font-medium">
                {t(AppLocales.Admin.Lessons.Questions.OptionsLabel)}
              </p>
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.SECONDARY}
                onClick={() => setOptions((current) => [...current, emptyOption()])}
              >
                {t(AppLocales.Admin.Lessons.Questions.AddOption)}
              </Button>
            </div>
            {optionsError ? (
              <p className="text-caption text-error">{optionsError}</p>
            ) : null}
            {options.map((option, index) => {
              const preview =
                option.imageSelection?.source === "pick"
                  ? option.imageSelection.asset.url
                  : option.imageSelection?.source === "upload"
                    ? option.imageSelection.previewUrl
                    : option.existingImage?.imageUrl;
              return (
                <div
                  key={option.clientId}
                  className="rounded-xl border border-base-300 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-s font-medium">
                      {t(AppLocales.Admin.Lessons.Questions.OptionLabel, {
                        index: index + 1,
                      })}
                    </p>
                    {options.length > 2 ? (
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        className="text-error"
                        onClick={() => {
                          revoke(option);
                          setOptions((current) =>
                            current.filter(
                              (item) => item.clientId !== option.clientId,
                            ),
                          );
                        }}
                      >
                        <iconsLib.trash className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <TextInput
                    label={t(AppLocales.Admin.Lessons.Questions.OptionTextLabel)}
                    placeholder={t(
                      AppLocales.Admin.Lessons.Questions.OptionTextPlaceholder,
                    )}
                    value={option.text}
                    onChange={(e) =>
                      updateOption(option.clientId, { text: e.target.value })
                    }
                    error={option.textError}
                  />
                  <Checkbox
                    checked={option.correct}
                    onChange={(e) =>
                      updateOption(option.clientId, {
                        correct: e.target.checked,
                      })
                    }
                  >
                    {t(AppLocales.Admin.Lessons.Questions.CorrectLabel)}
                  </Checkbox>
                  <div className="space-y-2">
                    {preview ? (
                      <Image
                        src={preview}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-base-300"
                      />
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.SECONDARY}
                        onClick={() => setPickerOptionId(option.clientId)}
                      >
                        {t(AppLocales.Admin.Lessons.Questions.PickButton)}
                      </Button>
                      {(option.imageSelection || option.existingImage) && (
                        <Button
                          size={ButtonSizes.SM}
                          variant={ButtonVariants.TERTIARY}
                          onClick={() => {
                            revoke(option);
                            updateOption(option.clientId, {
                              imageSelection: null,
                              existingImage: null,
                            });
                          }}
                        >
                          {t(AppLocales.Admin.Lessons.Questions.ClearImage)}
                        </Button>
                      )}
                    </div>
                    <FileInput
                      label={t(AppLocales.Admin.Lessons.Questions.UploadLabel)}
                      accept="image/*"
                      buttonText={t(
                        AppLocales.Admin.Lessons.Questions.ChooseImage,
                      )}
                      helperText={t(
                        AppLocales.Admin.Lessons.Questions.ImageHelper,
                        { size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB },
                      )}
                      onChange={(file) => {
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          toast.error(
                            t(
                              AppLocales.Admin.Lessons.Questions.Errors
                                .InvalidImage,
                            ),
                          );
                          return;
                        }
                        if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
                          toast.error(
                            t(
                              AppLocales.Admin.Lessons.Questions.Errors
                                .ImageTooLarge,
                              {
                                size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
                              },
                            ),
                          );
                          return;
                        }
                        revoke(option);
                        updateOption(option.clientId, {
                          imageSelection: {
                            source: "upload",
                            file,
                            previewUrl: URL.createObjectURL(file),
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Dialog>

      <AdminAssetSelectDialog
        isOpen={Boolean(pickerOptionId)}
        onClose={() => setPickerOptionId(null)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.IMAGE}
        title={t(AppLocales.Admin.Lessons.Questions.PickerTitle)}
        onSelect={(asset) => {
          if (!pickerOptionId) return;
          const current = options.find(
            (option) => option.clientId === pickerOptionId,
          );
          if (current) revoke(current);
          updateOption(pickerOptionId, {
            imageSelection: { source: "pick", asset },
          });
          setPickerOptionId(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t(AppLocales.Admin.Lessons.Questions.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.Questions.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
