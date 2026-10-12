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
  addLessonVocab,
  deleteLessonVocab,
  updateLessonVocab,
} from "../lesson.mock.store";
import type { IAdminLessonVocabItem } from "../types";

interface IAdminLessonVocabsSectionProps {
  lessonId: string;
  vocabs: IAdminLessonVocabItem[];
  onVocabsChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

export const AdminLessonVocabsSection: React.FC<
  IAdminLessonVocabsSectionProps
> = ({ lessonId, vocabs, onVocabsChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IAdminLessonVocabItem | null>(
    null,
  );
  const [vocab, setVocab] = useState("");
  const [vowelSound, setVowelSound] = useState("");
  const [vocabError, setVocabError] = useState("");
  const [vowelError, setVowelError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageSelection, setImageSelection] = useState<TImageSelection>(null);
  const [existingImage, setExistingImage] = useState<{
    imageAssetId: string;
    imageUrl: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IAdminLessonVocabItem | null>(
    null,
  );

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
    setVocab("");
    setVowelSound("");
    setVocabError("");
    setVowelError("");
    setImageError("");
    setExistingImage(null);
  };

  const closeForm = () => {
    resetFormState();
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetFormState();
    setIsFormOpen(true);
  };

  const openEditForm = (item: IAdminLessonVocabItem) => {
    clearImageSelection();
    setEditingItem(item);
    setVocab(item.vocab);
    setVowelSound(item.vowelSound);
    setExistingImage({
      imageAssetId: item.imageAssetId,
      imageUrl: item.imageUrl,
    });
    setVocabError("");
    setVowelError("");
    setImageError("");
    setIsFormOpen(true);
  };

  const validateImageFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      setImageError(t(AppLocales.Admin.Lessons.Vocabs.Errors.InvalidImage));
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
      setImageError(
        t(AppLocales.Admin.Lessons.Vocabs.Errors.ImageTooLarge, {
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
            t(AppLocales.Admin.Lessons.Vocabs.Errors.UploadImage),
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

    setImageError(t(AppLocales.Admin.Lessons.Vocabs.Errors.ImageRequired));
    return null;
  };

  const handleSave = async () => {
    let valid = true;
    if (!vocab.trim()) {
      setVocabError(t(AppLocales.Admin.Lessons.Vocabs.Errors.VocabRequired));
      valid = false;
    } else {
      setVocabError("");
    }
    if (!vowelSound.trim()) {
      setVowelError(t(AppLocales.Admin.Lessons.Vocabs.Errors.VowelRequired));
      valid = false;
    } else {
      setVowelError("");
    }
    if (!valid) return;

    setIsSaving(true);
    try {
      const image = await resolveImage();
      if (!image) return;

      const input = {
        vocab: vocab.trim(),
        vowelSound: vowelSound.trim(),
        imageAssetId: image.imageAssetId,
        imageUrl: image.imageUrl,
      };

      if (editingItem) {
        const updated = updateLessonVocab(lessonId, editingItem.id, input);
        if (!updated) {
          toast.error(t(AppLocales.Admin.Lessons.Vocabs.Errors.Update));
          return;
        }
        toast.success(t(AppLocales.Admin.Lessons.Vocabs.Toasts.UpdateSuccess));
      } else {
        const created = addLessonVocab(lessonId, input);
        if (!created) {
          toast.error(t(AppLocales.Admin.Lessons.Vocabs.Errors.Create));
          return;
        }
        toast.success(t(AppLocales.Admin.Lessons.Vocabs.Toasts.CreateSuccess));
      }

      closeForm();
      onVocabsChange();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ok = deleteLessonVocab(lessonId, deleteTarget.id);
    setDeleteTarget(null);
    if (ok) {
      toast.success(t(AppLocales.Admin.Lessons.Vocabs.Toasts.DeleteSuccess));
      if (editingItem?.id === deleteTarget.id) closeForm();
      onVocabsChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.Vocabs.Errors.Delete));
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

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.Vocabs.Title)}
        description={t(AppLocales.Admin.Lessons.Vocabs.Description)}
        icon={iconsLib.document}
        actions={
          <Button size={ButtonSizes.SM} onClick={openAddForm}>
            <iconsLib.plus className="mr-1.5 h-4 w-4 text-secondary-content" />
            {t(AppLocales.Admin.Lessons.Vocabs.AddButton)}
          </Button>
        }
      >
        <div className="space-y-6">
          {vocabs.length === 0 ? (
            <p className="text-body-s text-base-content/60 py-4 text-center">
              {t(AppLocales.Admin.Lessons.Vocabs.Empty)}
            </p>
          ) : (
            <ul className="space-y-3">
              {vocabs.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-base-300 bg-base-100 p-3"
                >
                  <Image
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover border border-base-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-m font-semibold text-base-content">
                      {item.vocab}
                    </p>
                    <p className="text-caption text-base-content/60">
                      {t(AppLocales.Admin.Lessons.Vocabs.VowelLabel)}:{" "}
                      {item.vowelSound}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="h-8 w-8 p-0"
                      aria-label={t(AppLocales.Admin.Common.Actions.Edit)}
                      onClick={() => openEditForm(item)}
                    >
                      <iconsLib.pencilSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="h-8 w-8 p-0 border border-error/30 text-error hover:bg-error/10"
                      aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                      onClick={() => setDeleteTarget(item)}
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
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editingItem
            ? t(AppLocales.Admin.Lessons.Vocabs.EditTitle)
            : t(AppLocales.Admin.Lessons.Vocabs.AddTitle)
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
                ? t(AppLocales.Admin.Lessons.Vocabs.SaveButton)
                : t(AppLocales.Admin.Lessons.Vocabs.AddButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label={t(AppLocales.Admin.Lessons.Vocabs.VocabLabel)}
              placeholder={t(AppLocales.Admin.Lessons.Vocabs.VocabPlaceholder)}
              value={vocab}
              error={vocabError}
              onChange={(e) => setVocab(e.target.value)}
              required
            />
            <TextInput
              label={t(AppLocales.Admin.Lessons.Vocabs.VowelLabel)}
              placeholder={t(AppLocales.Admin.Lessons.Vocabs.VowelPlaceholder)}
              value={vowelSound}
              error={vowelError}
              onChange={(e) => setVowelSound(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <p className="text-body-s font-medium text-base-content">
              {t(AppLocales.Admin.Lessons.Vocabs.ImageLabel)}
            </p>

            {!hasImage ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={ButtonVariants.SECONDARY}
                    onClick={() => setIsPickerOpen(true)}
                  >
                    <iconsLib.photo className="mr-2 h-4 w-4" />
                    {t(AppLocales.Admin.Lessons.Vocabs.PickButton)}
                  </Button>
                </div>
                <FileInput
                  label={t(AppLocales.Admin.Lessons.Vocabs.UploadLabel)}
                  accept="image/*"
                  buttonText={t(AppLocales.Admin.Lessons.Vocabs.ChooseImage)}
                  helperText={t(AppLocales.Admin.Lessons.Vocabs.ImageHelper, {
                    size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
                  })}
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
                      ? t(AppLocales.Admin.Lessons.Vocabs.PickedImage)
                      : imageSelection?.source === "upload"
                        ? t(AppLocales.Admin.Lessons.Vocabs.LocalImageSelected)
                        : t(AppLocales.Admin.Lessons.Vocabs.ExistingImage)}
                  </p>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => {
                      clearImageSelection();
                      setExistingImage(null);
                    }}
                  >
                    {t(AppLocales.Admin.Lessons.Vocabs.ClearImage)}
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
        title={t(AppLocales.Admin.Lessons.Vocabs.PickerTitle)}
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
        title={t(AppLocales.Admin.Lessons.Vocabs.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.Vocabs.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
