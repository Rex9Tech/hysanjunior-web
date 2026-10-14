import React, { useEffect, useState } from "react";
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
import type {
  IAdminLesson,
  IAdminLessonVocabulary,
  IAdminLessonVocabularyWrite,
} from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

export const AdminLessonVocabsSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const [items, setItems] = useState(lesson.vocabularies);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IAdminLessonVocabulary | null>(
    null,
  );
  const [vocab, setVocab] = useState("");
  const [vowelSymbol, setVowelSymbol] = useState("");
  const [vocabError, setVocabError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageSelection, setImageSelection] = useState<TImageSelection>(null);
  const [existingImage, setExistingImage] = useState<{
    imageAssetId: string;
    imageUrl: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<IAdminLessonVocabulary | null>(null);

  useEffect(() => {
    setItems(lesson.vocabularies);
  }, [lesson.vocabularies]);

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
    setVowelSymbol("");
    setVocabError("");
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

  const openEditForm = (item: IAdminLessonVocabulary) => {
    clearImageSelection();
    setEditingItem(item);
    setVocab(item.vocab);
    setVowelSymbol(item.vowel_symbol || "");
    setExistingImage(
      item.image_asset_id && item.image?.url
        ? { imageAssetId: item.image_asset_id, imageUrl: item.image.url }
        : null,
    );
    setVocabError("");
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

  const resolveImageAssetId = async (): Promise<string | null> => {
    if (imageSelection?.source === "pick") return imageSelection.asset.id;
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
      return uploadResult.asset.id;
    }
    if (existingImage) return existingImage.imageAssetId;
    setImageError(t(AppLocales.Admin.Lessons.Vocabs.Errors.ImageRequired));
    return null;
  };

  const syncVocabularies = async (next: IAdminLessonVocabularyWrite[]) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      vocabularies: next,
    });
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return false;
    }
    onLessonChange();
    return true;
  };

  const toWrite = (
    list: IAdminLessonVocabulary[],
  ): IAdminLessonVocabularyWrite[] =>
    list.map((item) => ({
      id: item.id,
      vocab: item.vocab,
      vowel_symbol: item.vowel_symbol,
      image_asset_id: item.image_asset_id,
    }));

  const handleSave = async () => {
    if (!vocab.trim()) {
      setVocabError(t(AppLocales.Admin.Lessons.Vocabs.Errors.VocabRequired));
      return;
    }
    setVocabError("");
    setIsSaving(true);
    const imageAssetId = await resolveImageAssetId();
    if (!imageAssetId) {
      setIsSaving(false);
      return;
    }

    const entry: IAdminLessonVocabularyWrite = {
      id: editingItem?.id,
      vocab: vocab.trim(),
      vowel_symbol: vowelSymbol.trim() || null,
      image_asset_id: imageAssetId,
    };

    const next = editingItem
      ? toWrite(items).map((item) =>
          item.id === editingItem.id ? entry : item,
        )
      : [...toWrite(items), entry];

    const ok = await syncVocabularies(next);
    setIsSaving(false);
    if (!ok) return;
    toast.success(
      editingItem
        ? t(AppLocales.Admin.Lessons.Vocabs.Toasts.UpdateSuccess)
        : t(AppLocales.Admin.Lessons.Vocabs.Toasts.CreateSuccess),
    );
    closeForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    const next = toWrite(items.filter((item) => item.id !== deleteTarget.id));
    const ok = await syncVocabularies(next);
    setIsSaving(false);
    setDeleteTarget(null);
    if (!ok) return;
    toast.success(t(AppLocales.Admin.Lessons.Vocabs.Toasts.DeleteSuccess));
    if (editingItem?.id === deleteTarget.id) closeForm();
  };

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
          {items.length === 0 ? (
            <p className="text-body-s text-base-content/60 py-4 text-center">
              {t(AppLocales.Admin.Lessons.Vocabs.Empty)}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-base-300 bg-base-100 p-3"
                >
                  {item.image?.url ? (
                    <Image
                      src={item.image.url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-base-300"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg border border-base-300 bg-base-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-body-m font-semibold text-base-content">
                      {item.vocab}
                    </p>
                    {item.vowel_symbol ? (
                      <p className="text-caption text-base-content/60">
                        {t(AppLocales.Admin.Lessons.Vocabs.VowelLabel)}:{" "}
                        {item.vowel_symbol}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      className="text-error"
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
          <div className="flex justify-end gap-2">
            <Button variant={ButtonVariants.TERTIARY} onClick={closeForm}>
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {t(AppLocales.Admin.Lessons.Vocabs.SaveButton)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextInput
            label={t(AppLocales.Admin.Lessons.Vocabs.VocabLabel)}
            placeholder={t(AppLocales.Admin.Lessons.Vocabs.VocabPlaceholder)}
            value={vocab}
            onChange={(e) => setVocab(e.target.value)}
            error={vocabError}
            required
          />
          <TextInput
            label={t(AppLocales.Admin.Lessons.Vocabs.VowelLabel)}
            placeholder={t(AppLocales.Admin.Lessons.Vocabs.VowelPlaceholder)}
            value={vowelSymbol}
            onChange={(e) => setVowelSymbol(e.target.value)}
          />
          <div className="space-y-2">
            <p className="text-body-s font-medium">
              {t(AppLocales.Admin.Lessons.Vocabs.ImageLabel)}
            </p>
            {imagePreviewUrl ? (
              <Image
                src={imagePreviewUrl}
                alt=""
                className="h-24 w-24 rounded-lg object-cover border border-base-300"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.SECONDARY}
                onClick={() => setIsPickerOpen(true)}
              >
                {t(AppLocales.Admin.Lessons.Vocabs.PickButton)}
              </Button>
              {(imageSelection || existingImage) && (
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
              )}
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
                if (!file || !validateImageFile(file)) return;
                clearImageSelection();
                setImageSelection({
                  source: "upload",
                  file,
                  previewUrl: URL.createObjectURL(file),
                });
              }}
            />
          </div>
        </div>
      </Dialog>

      <AdminAssetSelectDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.IMAGE}
        title={t(AppLocales.Admin.Lessons.Vocabs.PickerTitle)}
        onSelect={(asset) => {
          clearImageSelection();
          setImageSelection({ source: "pick", asset });
          setIsPickerOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t(AppLocales.Admin.Lessons.Vocabs.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.Vocabs.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
