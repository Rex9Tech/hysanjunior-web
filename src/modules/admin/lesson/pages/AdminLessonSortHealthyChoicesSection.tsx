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
  IAdminLessonSortHealthChoice,
  IAdminLessonSortHealthChoiceWrite,
  IAdminLessonVocabulary,
} from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

export const AdminLessonSortHealthyChoicesSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const [groups, setGroups] = useState(lesson.sort_health_choices);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] =
    useState<IAdminLessonSortHealthChoice | null>(null);
  const [groupLabel, setGroupLabel] = useState("");
  const [groupLabelError, setGroupLabelError] = useState("");
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<IAdminLessonVocabulary | null>(
    null,
  );
  const [itemVocab, setItemVocab] = useState("");
  const [itemVocabError, setItemVocabError] = useState("");
  const [imageSelection, setImageSelection] = useState<TImageSelection>(null);
  const [existingImage, setExistingImage] = useState<{
    imageAssetId: string;
    imageUrl: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteGroup, setDeleteGroup] =
    useState<IAdminLessonSortHealthChoice | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    groupId: string;
    item: IAdminLessonVocabulary;
  } | null>(null);

  useEffect(() => {
    setGroups(lesson.sort_health_choices);
  }, [lesson.sort_health_choices]);

  const clearImage = () => {
    if (imageSelection?.source === "upload") {
      URL.revokeObjectURL(imageSelection.previewUrl);
    }
    setImageSelection(null);
  };

  const toWrite = (
    list: IAdminLessonSortHealthChoice[],
  ): IAdminLessonSortHealthChoiceWrite[] =>
    list.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items.map((item) => ({
        id: item.id,
        vocab: item.vocab,
        image_asset_id: item.image_asset_id,
      })),
    }));

  const syncGroups = async (next: IAdminLessonSortHealthChoiceWrite[]) => {
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      sort_health_choices: next,
    });
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return false;
    }
    onLessonChange();
    return true;
  };

  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupLabel("");
    setGroupLabelError("");
    setIsGroupFormOpen(true);
  };

  const openEditGroup = (group: IAdminLessonSortHealthChoice) => {
    setEditingGroup(group);
    setGroupLabel(group.label);
    setGroupLabelError("");
    setIsGroupFormOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupLabel.trim()) {
      setGroupLabelError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.LabelRequired),
      );
      return;
    }
    const entry: IAdminLessonSortHealthChoiceWrite = {
      id: editingGroup?.id,
      label: groupLabel.trim(),
      items: editingGroup
        ? editingGroup.items.map((item) => ({
            id: item.id,
            vocab: item.vocab,
            image_asset_id: item.image_asset_id,
          }))
        : [],
    };
    const next = editingGroup
      ? toWrite(groups).map((group) =>
          group.id === editingGroup.id ? entry : group,
        )
      : [...toWrite(groups), entry];

    setIsSaving(true);
    const ok = await syncGroups(next);
    setIsSaving(false);
    if (!ok) return;
    toast.success(
      editingGroup
        ? t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.UpdateGroupSuccess)
        : t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.CreateGroupSuccess),
    );
    setIsGroupFormOpen(false);
  };

  const openAddItem = (groupId: string) => {
    clearImage();
    setActiveGroupId(groupId);
    setEditingItem(null);
    setItemVocab("");
    setItemVocabError("");
    setExistingImage(null);
    setIsItemFormOpen(true);
  };

  const openEditItem = (
    groupId: string,
    item: IAdminLessonVocabulary,
  ) => {
    clearImage();
    setActiveGroupId(groupId);
    setEditingItem(item);
    setItemVocab(item.vocab);
    setItemVocabError("");
    setExistingImage(
      item.image_asset_id && item.image?.url
        ? { imageAssetId: item.image_asset_id, imageUrl: item.image.url }
        : null,
    );
    setIsItemFormOpen(true);
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
            t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.UploadImage),
        );
        return null;
      }
      return uploadResult.asset.id;
    }
    return existingImage?.imageAssetId ?? null;
  };

  const handleSaveItem = async () => {
    if (!activeGroupId) return;
    if (!itemVocab.trim()) {
      setItemVocabError(
        t(AppLocales.Admin.Lessons.SortHealthyChoices.Errors.TextRequired),
      );
      return;
    }
    setIsSaving(true);
    const imageAssetId = await resolveImageAssetId();
    const itemWrite = {
      id: editingItem?.id,
      vocab: itemVocab.trim(),
      image_asset_id: imageAssetId,
    };
    const next = toWrite(groups).map((group) => {
      if (group.id !== activeGroupId) return group;
      const items = editingItem
        ? group.items.map((item) =>
            item.id === editingItem.id ? itemWrite : item,
          )
        : [...group.items, itemWrite];
      return { ...group, items };
    });
    const ok = await syncGroups(next);
    setIsSaving(false);
    if (!ok) return;
    toast.success(
      editingItem
        ? t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.UpdateSuccess)
        : t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.CreateSuccess),
    );
    clearImage();
    setIsItemFormOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    setIsSaving(true);
    const ok = await syncGroups(
      toWrite(groups.filter((group) => group.id !== deleteGroup.id)),
    );
    setIsSaving(false);
    setDeleteGroup(null);
    if (!ok) return;
    toast.success(
      t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.DeleteGroupSuccess),
    );
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    setIsSaving(true);
    const next = toWrite(groups).map((group) => {
      if (group.id !== deleteItem.groupId) return group;
      return {
        ...group,
        items: group.items.filter((item) => item.id !== deleteItem.item.id),
      };
    });
    const ok = await syncGroups(next);
    setIsSaving(false);
    setDeleteItem(null);
    if (!ok) return;
    toast.success(
      t(AppLocales.Admin.Lessons.SortHealthyChoices.Toasts.DeleteSuccess),
    );
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
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.Title)}
        description={t(AppLocales.Admin.Lessons.SortHealthyChoices.Description)}
        icon={iconsLib.document}
        actions={
          <Button size={ButtonSizes.SM} onClick={openAddGroup}>
            <iconsLib.plus className="mr-1.5 h-4 w-4 text-secondary-content" />
            {t(AppLocales.Admin.Lessons.SortHealthyChoices.AddGroup)}
          </Button>
        }
      >
        {groups.length === 0 ? (
          <p className="text-body-s text-base-content/60 py-4 text-center">
            {t(AppLocales.Admin.Lessons.SortHealthyChoices.Empty)}
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{group.label}</p>
                    <p className="text-caption text-base-content/60">
                      {t(AppLocales.Admin.Lessons.SortHealthyChoices.ItemsCount, {
                        count: group.items.length,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.SECONDARY}
                      onClick={() => openAddItem(group.id)}
                    >
                      {t(AppLocales.Admin.Lessons.SortHealthyChoices.AddItem)}
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      onClick={() => openEditGroup(group)}
                    >
                      <iconsLib.pencilSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="text-error"
                      onClick={() => setDeleteGroup(group)}
                    >
                      <iconsLib.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {group.items.length === 0 ? (
                  <p className="text-caption text-base-content/60">
                    {t(AppLocales.Admin.Lessons.SortHealthyChoices.EmptyBucket)}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-base-300/70 p-2"
                      >
                        {item.image?.url ? (
                          <Image
                            src={item.image.url}
                            alt=""
                            className="h-10 w-10 rounded object-cover border border-base-300"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-base-200 border border-base-300" />
                        )}
                        <span className="flex-1 text-body-s font-medium">
                          {item.vocab}
                        </span>
                        <Button
                          size={ButtonSizes.SM}
                          variant={ButtonVariants.TERTIARY}
                          onClick={() => openEditItem(group.id, item)}
                        >
                          <iconsLib.pencilSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size={ButtonSizes.SM}
                          variant={ButtonVariants.TERTIARY}
                          className="text-error"
                          onClick={() =>
                            setDeleteItem({ groupId: group.id, item })
                          }
                        >
                          <iconsLib.trash className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <Dialog
        isOpen={isGroupFormOpen}
        onClose={() => setIsGroupFormOpen(false)}
        title={
          editingGroup
            ? t(AppLocales.Admin.Lessons.SortHealthyChoices.EditGroupTitle)
            : t(AppLocales.Admin.Lessons.SortHealthyChoices.AddGroupTitle)
        }
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={() => setIsGroupFormOpen(false)}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSaveGroup()}
              isLoading={isSaving}
            >
              {t(AppLocales.Admin.Lessons.SortHealthyChoices.SaveGroup)}
            </Button>
          </div>
        }
      >
        <TextInput
          label={t(AppLocales.Admin.Lessons.SortHealthyChoices.BucketTitleLabel)}
          placeholder={t(
            AppLocales.Admin.Lessons.SortHealthyChoices.BucketTitlePlaceholder,
          )}
          value={groupLabel}
          onChange={(e) => setGroupLabel(e.target.value)}
          error={groupLabelError}
        />
      </Dialog>

      <Dialog
        isOpen={isItemFormOpen}
        onClose={() => {
          clearImage();
          setIsItemFormOpen(false);
        }}
        title={
          editingItem
            ? t(AppLocales.Admin.Lessons.SortHealthyChoices.EditTitle)
            : t(AppLocales.Admin.Lessons.SortHealthyChoices.AddTitle)
        }
        className="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant={ButtonVariants.TERTIARY}
              onClick={() => {
                clearImage();
                setIsItemFormOpen(false);
              }}
            >
              {t(AppLocales.Admin.Common.Actions.Cancel)}
            </Button>
            <Button
              onClick={() => void handleSaveItem()}
              isLoading={isSaving}
            >
              {t(AppLocales.Admin.Lessons.SortHealthyChoices.SaveButton)}
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
            value={itemVocab}
            onChange={(e) => setItemVocab(e.target.value)}
            error={itemVocabError}
          />
          <div className="space-y-2">
            {imagePreviewUrl ? (
              <Image
                src={imagePreviewUrl}
                alt=""
                className="h-20 w-20 rounded-lg object-cover border border-base-300"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.SECONDARY}
                onClick={() => setIsPickerOpen(true)}
              >
                {t(AppLocales.Admin.Lessons.SortHealthyChoices.PickButton)}
              </Button>
              {(imageSelection || existingImage) && (
                <Button
                  size={ButtonSizes.SM}
                  variant={ButtonVariants.TERTIARY}
                  onClick={() => {
                    clearImage();
                    setExistingImage(null);
                  }}
                >
                  {t(AppLocales.Admin.Lessons.SortHealthyChoices.ClearImage)}
                </Button>
              )}
            </div>
            <FileInput
              label={t(AppLocales.Admin.Lessons.SortHealthyChoices.UploadLabel)}
              accept="image/*"
              buttonText={t(
                AppLocales.Admin.Lessons.SortHealthyChoices.ChooseImage,
              )}
              helperText={t(
                AppLocales.Admin.Lessons.SortHealthyChoices.ImageHelper,
                { size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB },
              )}
              onChange={(file) => {
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  toast.error(
                    t(
                      AppLocales.Admin.Lessons.SortHealthyChoices.Errors
                        .InvalidImage,
                    ),
                  );
                  return;
                }
                if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
                  toast.error(
                    t(
                      AppLocales.Admin.Lessons.SortHealthyChoices.Errors
                        .ImageTooLarge,
                      { size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB },
                    ),
                  );
                  return;
                }
                clearImage();
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
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.PickerTitle)}
        onSelect={(asset) => {
          clearImage();
          setImageSelection({ source: "pick", asset });
          setIsPickerOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteGroup)}
        title={t(
          AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteGroupTitle,
        )}
        message={t(
          AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteGroupMessage,
        )}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleDeleteGroup()}
        onClose={() => setDeleteGroup(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title={t(AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteTitle)}
        message={t(
          AppLocales.Admin.Lessons.SortHealthyChoices.Confirm.DeleteMessage,
        )}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={() => void handleDeleteItem()}
        onClose={() => setDeleteItem(null)}
      />
    </>
  );
};
