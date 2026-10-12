import React, { useState } from "react";
import { iconsLib } from "../../../../assets";
import { UPLOAD_SIZE_LIMITS } from "../../../../constants";
import {
  Button,
  DetailSection,
  Dialog,
  FileInput,
  Image,
  TextInput,
} from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import { ConfirmDialog } from "../../components";
import { Admin } from "../..";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import { ASSET_FORMATS, ASSET_TYPES } from "../../asset/constants";
import type { IAdminAsset } from "../../asset/types";
import {
  addLessonSortHealthyItem,
  deleteLessonSortHealthyItem,
  updateLessonSortHealthyBucketTitle,
  updateLessonSortHealthyItem,
} from "../lesson.mock.store";
import type {
  IAdminLessonSortHealthyChoice,
  IAdminLessonSortHealthyItem,
  TAdminLessonSortHealthyBucketKey,
} from "../types";

interface IAdminLessonSortHealthyChoicesSectionProps {
  lessonId: string;
  sortHealthyChoice: IAdminLessonSortHealthyChoice;
  onSortHealthyChoiceChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

type TDeleteTarget = {
  bucketKey: TAdminLessonSortHealthyBucketKey;
  item: IAdminLessonSortHealthyItem;
};

const BUCKET_KEYS: TAdminLessonSortHealthyBucketKey[] = [
  "healthyFood",
  "junkFood",
];

export const AdminLessonSortHealthyChoicesSection: React.FC<
  IAdminLessonSortHealthyChoicesSectionProps
> = ({ lessonId, sortHealthyChoice, onSortHealthyChoiceChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeBucketKey, setActiveBucketKey] =
    useState<TAdminLessonSortHealthyBucketKey>("healthyFood");
  const [editingItem, setEditingItem] =
    useState<IAdminLessonSortHealthyItem | null>(null);
  const [text, setText] = useState("");
  const [textError, setTextError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageSelection, setImageSelection] = useState<TImageSelection>(null);
  const [existingImage, setExistingImage] = useState<{
    imageAssetId: string;
    imageUrl: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget | null>(null);

  const [editingTitleKey, setEditingTitleKey] =
    useState<TAdminLessonSortHealthyBucketKey | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const clearImageSelection = () => {
    if (imageSelection?.source === "upload") {
      URL.revokeObjectURL(imageSelection.previewUrl);
    }
    setImageSelection(null);
    setImageError("");
  };

  const resetFormState = () => {
    clearImageSelection();
    setEditingItem(null);
    setText("");
    setTextError("");
    setImageError("");
    setExistingImage(null);
  };

  const closeForm = () => {
    resetFormState();
    setIsFormOpen(false);
  };

  const openAddForm = (bucketKey: TAdminLessonSortHealthyBucketKey) => {
    resetFormState();
    setActiveBucketKey(bucketKey);
    setIsFormOpen(true);
  };

  const openEditForm = (
    bucketKey: TAdminLessonSortHealthyBucketKey,
    item: IAdminLessonSortHealthyItem,
  ) => {
    clearImageSelection();
    setActiveBucketKey(bucketKey);
    setEditingItem(item);
    setText(item.text);
    setExistingImage({
      imageAssetId: item.imageAssetId,
      imageUrl: item.imageUrl,
    });
    setTextError("");
    setImageError("");
    setIsFormOpen(true);
  };

  const openEditTitle = (bucketKey: TAdminLessonSortHealthyBucketKey) => {
    setEditingTitleKey(bucketKey);
    setEditTitle(sortHealthyChoice[bucketKey].title);
    setTitleError("");
  };

  const closeEditTitle = () => {
    setEditingTitleKey(null);
    setEditTitle("");
    setTitleError("");
  };

  const handleSaveTitle = () => {
    if (!editingTitleKey) return;
    const title = editTitle.trim();
    if (!title) {
      setTitleError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.TitleRequired),
      );
      return;
    }
    setTitleError("");
    setIsSavingTitle(true);
    const updated = updateLessonSortHealthyBucketTitle(
      lessonId,
      editingTitleKey,
      title,
    );
    setIsSavingTitle(false);
    if (!updated) {
      toast.error(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.UpdateTitle),
      );
      return;
    }
    toast.success(
      t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.UpdateTitleSuccess),
    );
    closeEditTitle();
    onSortHealthyChoiceChange();
  };

  const validateImageFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      setImageError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.InvalidImage),
      );
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
      setImageError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.ImageTooLarge, {
          size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
        }),
      );
      return false;
    }
    setImageError("");
    return true;
  };

  const resolveImage = async (): Promise<{
    imageAssetId: string;
    imageUrl: string;
  } | null> => {
    if (imageSelection?.source === "pick") {
      return {
        imageAssetId: imageSelection.asset.id,
        imageUrl: imageSelection.asset.url,
      };
    }

    if (imageSelection?.source === "upload") {
      const uploadResult = await Admin.AssetController.uploadAsset(
        imageSelection.file,
        {
          type: ASSET_TYPES.GENERAL,
          title: imageSelection.file.name.replace(/\.[^.]+$/, ""),
        },
      );
      if (!uploadResult.success || !uploadResult.asset) {
        toast.error(
          uploadResult.error ||
            t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.UploadImage),
        );
        return null;
      }
      return {
        imageAssetId: uploadResult.asset.id,
        imageUrl: uploadResult.asset.url,
      };
    }

    if (existingImage) {
      return existingImage;
    }

    setImageError(
      t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.ImageRequired),
    );
    return null;
  };

  const handleSave = async () => {
    if (!text.trim()) {
      setTextError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.TextRequired),
      );
      return;
    }
    setTextError("");

    setIsSaving(true);
    try {
      const image = await resolveImage();
      if (!image) return;

      const input = {
        text: text.trim(),
        imageAssetId: image.imageAssetId,
        imageUrl: image.imageUrl,
      };

      if (editingItem) {
        const updated = updateLessonSortHealthyItem(
          lessonId,
          activeBucketKey,
          editingItem.id,
          input,
        );
        if (!updated) {
          toast.error(
            t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.Update),
          );
          return;
        }
        toast.success(
          t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.UpdateSuccess),
        );
      } else {
        const created = addLessonSortHealthyItem(
          lessonId,
          activeBucketKey,
          input,
        );
        if (!created) {
          toast.error(
            t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.Create),
          );
          return;
        }
        toast.success(
          t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.CreateSuccess),
        );
      }

      closeForm();
      onSortHealthyChoiceChange();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ok = deleteLessonSortHealthyItem(
      lessonId,
      deleteTarget.bucketKey,
      deleteTarget.item.id,
    );
    setDeleteTarget(null);
    if (ok) {
      toast.success(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.DeleteSuccess),
      );
      if (editingItem?.id === deleteTarget.item.id) closeForm();
      onSortHealthyChoiceChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.Delete));
    }
  };

  const hasImage =
    Boolean(imageSelection) || Boolean(existingImage && !imageSelection);

  const imagePreviewUrl =
    imageSelection?.source === "pick"
      ? imageSelection.asset.url
      : imageSelection?.source === "upload"
        ? imageSelection.previewUrl
        : existingImage?.imageUrl;

  const activeBucketTitle = sortHealthyChoice[activeBucketKey].title;

  const renderBucket = (bucketKey: TAdminLessonSortHealthyBucketKey) => {
    const bucket = sortHealthyChoice[bucketKey];

    return (
      <div
        key={bucketKey}
        className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-body-m font-semibold text-base-content truncate">
                {bucket.title}
              </p>
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                className="h-8 w-8 shrink-0 p-0"
                aria-label={t(
                  AppLocales.Admin.Lessons.SortHealthyChoices.EditBucketTitle,
                )}
                onClick={() => openEditTitle(bucketKey)}
              >
                <iconsLib.pencilSquare className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Lessons.SortHealthyChoices.ItemsCount, {
                count: bucket.items.length,
              })}
            </p>
          </div>
          <Button
            size={ButtonSizes.SM}
            variant={ButtonVariants.SECONDARY}
            onClick={() => openAddForm(bucketKey)}
          >
            <iconsLib.plus className="mr-1 h-4 w-4" />
            {t(AppLocales.Admin.Lessons.SortHealthyChoices.AddItem)}
          </Button>
        </div>

        {bucket.items.length === 0 ? (
          <p className="text-body-s text-base-content/60 py-2 text-center">
            {t(AppLocales.Admin.Lessons.SortHealthyChoices.EmptyBucket)}
          </p>
        ) : (
          <ul className="space-y-2">
            {bucket.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-200/30 p-2.5"
              >
                <Image
                  src={item.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover border border-base-300"
                />
                <p className="min-w-0 flex-1 text-body-s font-medium text-base-content">
                  {item.text}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    className="h-8 w-8 p-0"
                    aria-label={t(AppLocales.Admin.Common.Actions.Edit)}
                    onClick={() => openEditForm(bucketKey, item)}
                  >
                    <iconsLib.pencilSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    className="h-8 w-8 p-0 border border-error/30 text-error hover:bg-error/10"
                    aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                    onClick={() => setDeleteTarget({ bucketKey, item })}
                  >
                    <iconsLib.trash className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.Title)}
        description={t(AppLocales.Admin.Lessons.SortHealthyChoices.Description)}
        icon={iconsLib.document}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {BUCKET_KEYS.map(renderBucket)}
        </div>
      </DetailSection>

      <Dialog
        isOpen={Boolean(editingTitleKey)}
        onClose={closeEditTitle}
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.EditBucketTitle)}
        className="max-w-md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={closeEditTitle}
              disabled={isSavingTitle}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={handleSaveTitle}
              isLoading={isSavingTitle}
              disabled={isSavingTitle}
            >
              {t(AppLocales.Admin.Lessons.SortHealthyChoices.SaveBucketTitle)}
            </Button>
          </div>
        }
      >
        <TextInput
          label={t(AppLocales.Admin.Lessons.SortHealthyChoices.BucketTitleLabel)}
          placeholder={t(
            AppLocales.Admin.Lessons.SortHealthyChoices.BucketTitlePlaceholder,
          )}
          value={editTitle}
          error={titleError}
          onChange={(e) => setEditTitle(e.target.value)}
          required
        />
      </Dialog>

      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editingItem
            ? t(AppLocales.Admin.Lessons.SortHealthyChoices.EditTitle, {
                bucket: activeBucketTitle,
              })
            : t(AppLocales.Admin.Lessons.SortHealthyChoices.AddTitle, {
                bucket: activeBucketTitle,
              })
        }
        className="max-w-lg"
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
                ? t(AppLocales.Admin.Lessons.SortHealthyChoices.SaveButton)
                : t(AppLocales.Admin.Lessons.SortHealthyChoices.AddItem)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextInput
            label={t(AppLocales.Admin.Lessons.SortHealthyChoices.TextLabel)}
            placeholder={t(
              AppLocales.Admin.Lessons.SortHealthyChoices.TextPlaceholder,
            )}
            value={text}
            error={textError}
            onChange={(e) => setText(e.target.value)}
            required
          />

          <div className="space-y-3">
            <p className="text-body-s font-medium text-base-content">
              {t(AppLocales.Admin.Lessons.SortHealthyChoices.ImageLabel)}
            </p>

            {!hasImage ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={ButtonVariants.SECONDARY}
                    onClick={() => setIsPickerOpen(true)}
                  >
                    <iconsLib.photo className="mr-2 h-4 w-4" />
                    {t(AppLocales.Admin.Lessons.SortHealthyChoices.PickButton)}
                  </Button>
                </div>
                <FileInput
                  label={t(
                    AppLocales.Admin.Lessons.SortHealthyChoices.UploadLabel,
                  )}
                  accept="image/*"
                  buttonText={t(
                    AppLocales.Admin.Lessons.SortHealthyChoices.ChooseImage,
                  )}
                  helperText={t(
                    AppLocales.Admin.Lessons.SortHealthyChoices.ImageHelper,
                    {
                      size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
                    },
                  )}
                  error={imageError}
                  onChange={(file) => {
                    if (!file) {
                      clearImageSelection();
                      return;
                    }
                    if (!validateImageFile(file)) return;
                    clearImageSelection();
                    setExistingImage(null);
                    setImageSelection({
                      source: "upload",
                      file,
                      previewUrl: URL.createObjectURL(file),
                    });
                  }}
                />
              </>
            ) : (
              <div className="flex flex-wrap items-start gap-3">
                {imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover border border-base-300"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-body-s font-semibold truncate">
                    {imageSelection?.source === "pick"
                      ? imageSelection.asset.title || imageSelection.asset.name
                      : imageSelection?.source === "upload"
                        ? imageSelection.file.name
                        : existingImage?.imageAssetId}
                  </p>
                  <p className="text-caption text-base-content/60">
                    {imageSelection?.source === "pick"
                      ? t(
                          AppLocales.Admin.Lessons.SortHealthyChoices
                            .PickedImage,
                        )
                      : imageSelection?.source === "upload"
                        ? t(
                            AppLocales.Admin.Lessons.SortHealthyChoices
                              .LocalImageSelected,
                          )
                        : t(
                            AppLocales.Admin.Lessons.SortHealthyChoices
                              .ExistingImage,
                          )}
                  </p>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => {
                      clearImageSelection();
                      setExistingImage(null);
                    }}
                  >
                    {t(AppLocales.Admin.Lessons.SortHealthyChoices.ClearImage)}
                  </Button>
                </div>
              </div>
            )}
            {imageError && hasImage ? (
              <p className="text-caption text-error">{imageError}</p>
            ) : null}
          </div>
        </div>
      </Dialog>

      <AdminAssetSelectDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.IMAGE}
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.PickerTitle)}
        selectedAssetId={
          imageSelection?.source === "pick"
            ? imageSelection.asset.id
            : existingImage?.imageAssetId
        }
        onSelect={(asset) => {
          clearImageSelection();
          setExistingImage(null);
          setImageSelection({ source: "pick", asset });
          setImageError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteTitle)}
        message={t(
          AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteMessage,
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
