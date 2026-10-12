import React, { useState } from "react";
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
  addLessonHealthyChoice,
  deleteLessonHealthyChoice,
  updateLessonHealthyChoice,
} from "../lesson.mock.store";
import type { IAdminLessonHealthyChoiceQuestion } from "../types";

interface IAdminLessonHealthyChoicesSectionProps {
  lessonId: string;
  healthyChoices: IAdminLessonHealthyChoiceQuestion[];
  onHealthyChoicesChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

type TOptionDraft = {
  id: string;
  text: string;
  isCorrect: boolean;
  imageSelection: TImageSelection;
  existingImage: { imageAssetId: string; imageUrl: string } | null;
  textError: string;
  imageError: string;
};

const createDraftOptionId = (): string =>
  `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyOption = (): TOptionDraft => ({
  id: createDraftOptionId(),
  text: "",
  isCorrect: false,
  imageSelection: null,
  existingImage: null,
  textError: "",
  imageError: "",
});

export const AdminLessonHealthyChoicesSection: React.FC<
  IAdminLessonHealthyChoicesSectionProps
> = ({ lessonId, healthyChoices, onHealthyChoicesChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<IAdminLessonHealthyChoiceQuestion | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [options, setOptions] = useState<TOptionDraft[]>([
    createEmptyOption(),
    createEmptyOption(),
  ]);
  const [pickerOptionId, setPickerOptionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<IAdminLessonHealthyChoiceQuestion | null>(null);

  const revokeOptionImage = (option: TOptionDraft) => {
    if (option.imageSelection?.source === "upload") {
      URL.revokeObjectURL(option.imageSelection.previewUrl);
    }
  };

  const resetFormState = () => {
    options.forEach(revokeOptionImage);
    setEditingItem(null);
    setTitle("");
    setTitleError("");
    setOptionsError("");
    setOptions([createEmptyOption(), createEmptyOption()]);
    setPickerOptionId(null);
  };

  const closeForm = () => {
    resetFormState();
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetFormState();
    setIsFormOpen(true);
  };

  const openEditForm = (item: IAdminLessonHealthyChoiceQuestion) => {
    options.forEach(revokeOptionImage);
    setEditingItem(item);
    setTitle(item.title);
    setTitleError("");
    setOptionsError("");
    setOptions(
      item.options.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: item.correctOptionIds.includes(option.id),
        imageSelection: null,
        existingImage: {
          imageAssetId: option.imageAssetId,
          imageUrl: option.imageUrl,
        },
        textError: "",
        imageError: "",
      })),
    );
    setPickerOptionId(null);
    setIsFormOpen(true);
  };

  const updateOption = (optionId: string, patch: Partial<TOptionDraft>) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === optionId ? { ...option, ...patch } : option,
      ),
    );
  };

  const addOption = () => {
    setOptions((current) => [...current, createEmptyOption()]);
  };

  const removeOption = (optionId: string) => {
    setOptions((current) => {
      if (current.length <= 2) return current;
      const target = current.find((option) => option.id === optionId);
      if (target) revokeOptionImage(target);
      return current.filter((option) => option.id !== optionId);
    });
  };

  const validateImageFile = (file: File, optionId: string): boolean => {
    if (!file.type.startsWith("image/")) {
      updateOption(optionId, {
        imageError: t(AppLocales.Admin.Lessons.HealthyChoices.Errors.InvalidImage),
      });
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
      updateOption(optionId, {
        imageError: t(
          AppLocales.Admin.Lessons.HealthyChoices.Errors.ImageTooLarge,
          { size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB },
        ),
      });
      return false;
    }
    updateOption(optionId, { imageError: "" });
    return true;
  };

  const resolveOptionImage = async (
    option: TOptionDraft,
  ): Promise<{ imageAssetId: string; imageUrl: string } | null> => {
    if (option.imageSelection?.source === "pick") {
      return {
        imageAssetId: option.imageSelection.asset.id,
        imageUrl: option.imageSelection.asset.url,
      };
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
            t(AppLocales.Admin.Lessons.HealthyChoices.Errors.UploadImage),
        );
        return null;
      }
      return {
        imageAssetId: uploadResult.asset.id,
        imageUrl: uploadResult.asset.url,
      };
    }

    if (option.existingImage) {
      return option.existingImage;
    }

    return null;
  };

  const handleSave = async () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError(t(AppLocales.Admin.Lessons.HealthyChoices.Errors.TitleRequired));
      valid = false;
    } else {
      setTitleError("");
    }

    if (options.length < 2) {
      setOptionsError(t(AppLocales.Admin.Lessons.HealthyChoices.Errors.OptionsMin));
      valid = false;
    } else {
      setOptionsError("");
    }

    const nextOptions = options.map((option) => {
      const textError = !option.text.trim()
        ? t(AppLocales.Admin.Lessons.HealthyChoices.Errors.OptionTextRequired)
        : "";
      const hasImage =
        Boolean(option.imageSelection) || Boolean(option.existingImage);
      const imageError = !hasImage
        ? t(AppLocales.Admin.Lessons.HealthyChoices.Errors.ImageRequired)
        : "";
      if (textError || imageError) valid = false;
      return { ...option, textError, imageError };
    });
    setOptions(nextOptions);

    if (!nextOptions.some((option) => option.isCorrect)) {
      setOptionsError(
        t(AppLocales.Admin.Lessons.HealthyChoices.Errors.CorrectRequired),
      );
      valid = false;
    }

    if (!valid) return;

    setIsSaving(true);
    try {
      const optionPayload: Array<{
        id: string;
        text: string;
        imageAssetId: string;
        imageUrl: string;
        isCorrect: boolean;
      }> = [];

      for (const [index, option] of nextOptions.entries()) {
        const image = await resolveOptionImage(option);
        if (!image) {
          updateOption(option.id, {
            imageError: t(
              AppLocales.Admin.Lessons.HealthyChoices.Errors.ImageRequired,
            ),
          });
          return;
        }

        const id = option.id.startsWith("draft-")
          ? `hco-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`
          : option.id;

        optionPayload.push({
          id,
          text: option.text.trim(),
          imageAssetId: image.imageAssetId,
          imageUrl: image.imageUrl,
          isCorrect: option.isCorrect,
        });
      }

      const input = {
        title: title.trim(),
        options: optionPayload.map(({ id, text, imageAssetId, imageUrl }) => ({
          id,
          text,
          imageAssetId,
          imageUrl,
        })),
        correctOptionIds: optionPayload
          .filter((option) => option.isCorrect)
          .map((option) => option.id),
      };

      if (editingItem) {
        const updated = updateLessonHealthyChoice(
          lessonId,
          editingItem.id,
          input,
        );
        if (!updated) {
          toast.error(t(AppLocales.Admin.Lessons.HealthyChoices.Errors.Update));
          return;
        }
        toast.success(
          t(AppLocales.Admin.Lessons.HealthyChoices.Toasts.UpdateSuccess),
        );
      } else {
        const created = addLessonHealthyChoice(lessonId, input);
        if (!created) {
          toast.error(t(AppLocales.Admin.Lessons.HealthyChoices.Errors.Create));
          return;
        }
        toast.success(
          t(AppLocales.Admin.Lessons.HealthyChoices.Toasts.CreateSuccess),
        );
      }

      closeForm();
      onHealthyChoicesChange();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ok = deleteLessonHealthyChoice(lessonId, deleteTarget.id);
    setDeleteTarget(null);
    if (ok) {
      toast.success(
        t(AppLocales.Admin.Lessons.HealthyChoices.Toasts.DeleteSuccess),
      );
      if (editingItem?.id === deleteTarget.id) closeForm();
      onHealthyChoicesChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.HealthyChoices.Errors.Delete));
    }
  };

  const getOptionPreviewUrl = (option: TOptionDraft): string | undefined => {
    if (option.imageSelection?.source === "pick") {
      return option.imageSelection.asset.url;
    }
    if (option.imageSelection?.source === "upload") {
      return option.imageSelection.previewUrl;
    }
    return option.existingImage?.imageUrl;
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.HealthyChoices.Title)}
        description={t(AppLocales.Admin.Lessons.HealthyChoices.Description)}
        icon={iconsLib.document}
        actions={
          <Button size={ButtonSizes.SM} onClick={openAddForm}>
            <iconsLib.plus className="mr-1.5 h-4 w-4 text-secondary-content" />
            {t(AppLocales.Admin.Lessons.HealthyChoices.AddButton)}
          </Button>
        }
      >
        <div className="space-y-3">
          {healthyChoices.length === 0 ? (
            <p className="text-body-s text-base-content/60">
              {t(AppLocales.Admin.Lessons.HealthyChoices.Empty)}
            </p>
          ) : (
            <ul className="space-y-3">
              {healthyChoices.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-base-300 bg-base-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <p className="text-body-m font-semibold text-base-content">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={BadgeVariants.DEFAULT}
                          size={ComponentSizes.SM}
                        >
                          {t(
                            AppLocales.Admin.Lessons.HealthyChoices.OptionsCount,
                            { count: item.options.length },
                          )}
                        </Badge>
                        <Badge
                          variant={BadgeVariants.SUCCESS}
                          size={ComponentSizes.SM}
                        >
                          {t(
                            AppLocales.Admin.Lessons.HealthyChoices.CorrectCount,
                            { count: item.correctOptionIds.length },
                          )}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center gap-2 rounded-lg border border-base-300 px-2 py-1"
                          >
                            <Image
                              src={option.imageUrl}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                            <span className="text-caption text-base-content/80">
                              {option.text}
                            </span>
                            {item.correctOptionIds.includes(option.id) ? (
                              <Badge
                                variant={BadgeVariants.SUCCESS}
                                size={ComponentSizes.SM}
                              >
                                {t(
                                  AppLocales.Admin.Lessons.HealthyChoices
                                    .CorrectBadge,
                                )}
                              </Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        onClick={() => openEditForm(item)}
                      >
                        <iconsLib.pencilSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        className="border border-error/30 text-error hover:bg-error/10"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <iconsLib.trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editingItem
            ? t(AppLocales.Admin.Lessons.HealthyChoices.EditTitle)
            : t(AppLocales.Admin.Lessons.HealthyChoices.AddTitle)
        }
        className="max-w-2xl"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={closeForm}
              disabled={isSaving}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {editingItem
                ? t(AppLocales.Admin.Lessons.HealthyChoices.SaveButton)
                : t(AppLocales.Admin.Lessons.HealthyChoices.AddButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <TextInput
            label={t(AppLocales.Admin.Lessons.HealthyChoices.TitleLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.HealthyChoices.TitlePlaceholder,
            )}
            value={title}
            error={titleError}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-body-s font-medium text-base-content">
                {t(AppLocales.Admin.Lessons.HealthyChoices.OptionsLabel)}
              </p>
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                onClick={addOption}
              >
                <iconsLib.plus className="mr-1 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.HealthyChoices.AddOption)}
              </Button>
            </div>

            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {options.map((option, index) => {
                const previewUrl = getOptionPreviewUrl(option);
                const hasImage = Boolean(previewUrl);
                return (
                  <div
                    key={option.id}
                    className="rounded-xl border border-base-300 bg-base-200/20 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-caption font-semibold text-base-content/60">
                        {t(AppLocales.Admin.Lessons.HealthyChoices.OptionLabel, {
                          index: index + 1,
                        })}
                      </p>
                      <Button
                        size={ButtonSizes.SM}
                        variant={ButtonVariants.TERTIARY}
                        className="h-8 w-8 p-0 border border-error/30 text-error hover:bg-error/10"
                        onClick={() => removeOption(option.id)}
                        disabled={options.length <= 2}
                        aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                      >
                        <iconsLib.trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <TextInput
                      label={t(
                        AppLocales.Admin.Lessons.HealthyChoices.OptionTextLabel,
                      )}
                      placeholder={t(
                        AppLocales.Admin.Lessons.HealthyChoices
                          .OptionTextPlaceholder,
                      )}
                      value={option.text}
                      error={option.textError}
                      onChange={(e) =>
                        updateOption(option.id, {
                          text: e.target.value,
                          textError: "",
                        })
                      }
                      required
                    />

                    <Checkbox
                      checked={option.isCorrect}
                      onChange={(e) =>
                        updateOption(option.id, {
                          isCorrect: e.target.checked,
                        })
                      }
                    >
                      {t(AppLocales.Admin.Lessons.HealthyChoices.CorrectLabel)}
                    </Checkbox>

                    <div className="space-y-2">
                      <p className="text-body-s font-medium text-base-content">
                        {t(AppLocales.Admin.Lessons.HealthyChoices.ImageLabel)}
                      </p>
                      {!hasImage ? (
                        <>
                          <Button
                            size={ButtonSizes.SM}
                            variant={ButtonVariants.SECONDARY}
                            onClick={() => setPickerOptionId(option.id)}
                          >
                            <iconsLib.photo className="mr-2 h-4 w-4" />
                            {t(
                              AppLocales.Admin.Lessons.HealthyChoices.PickButton,
                            )}
                          </Button>
                          <FileInput
                            label={t(
                              AppLocales.Admin.Lessons.HealthyChoices
                                .UploadLabel,
                            )}
                            accept="image/*"
                            buttonText={t(
                              AppLocales.Admin.Lessons.HealthyChoices
                                .ChooseImage,
                            )}
                            helperText={t(
                              AppLocales.Admin.Lessons.HealthyChoices
                                .ImageHelper,
                              { size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB },
                            )}
                            error={option.imageError}
                            onChange={(file) => {
                              if (!file) {
                                revokeOptionImage(option);
                                updateOption(option.id, {
                                  imageSelection: null,
                                  imageError: "",
                                });
                                return;
                              }
                              if (!validateImageFile(file, option.id)) return;
                              revokeOptionImage(option);
                              updateOption(option.id, {
                                existingImage: null,
                                imageSelection: {
                                  source: "upload",
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                },
                                imageError: "",
                              });
                            }}
                          />
                        </>
                      ) : (
                        <div className="flex flex-wrap items-start gap-3">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover border border-base-300"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-body-s font-semibold truncate">
                              {option.imageSelection?.source === "pick"
                                ? option.imageSelection.asset.title ||
                                  option.imageSelection.asset.name
                                : option.imageSelection?.source === "upload"
                                  ? option.imageSelection.file.name
                                  : option.existingImage?.imageAssetId}
                            </p>
                            <Button
                              size={ButtonSizes.SM}
                              variant={ButtonVariants.TERTIARY}
                              onClick={() => {
                                revokeOptionImage(option);
                                updateOption(option.id, {
                                  imageSelection: null,
                                  existingImage: null,
                                  imageError: "",
                                });
                              }}
                            >
                              {t(
                                AppLocales.Admin.Lessons.HealthyChoices
                                  .ClearImage,
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {option.imageError && hasImage ? (
                        <p className="text-caption text-error">
                          {option.imageError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {optionsError ? (
              <p className="text-caption text-error">{optionsError}</p>
            ) : null}
          </div>
        </div>
      </Dialog>

      <AdminAssetSelectDialog
        isOpen={Boolean(pickerOptionId)}
        onClose={() => setPickerOptionId(null)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.IMAGE}
        title={t(AppLocales.Admin.Lessons.HealthyChoices.PickerTitle)}
        onSelect={(asset) => {
          if (!pickerOptionId) return;
          const current = options.find((option) => option.id === pickerOptionId);
          if (current) revokeOptionImage(current);
          updateOption(pickerOptionId, {
            existingImage: null,
            imageSelection: { source: "pick", asset },
            imageError: "",
          });
          setPickerOptionId(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t(AppLocales.Admin.Lessons.HealthyChoices.Confirm.DeleteTitle)}
        message={t(
          AppLocales.Admin.Lessons.HealthyChoices.Confirm.DeleteMessage,
        )}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
