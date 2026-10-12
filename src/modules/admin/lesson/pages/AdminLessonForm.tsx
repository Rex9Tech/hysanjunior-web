import React, { useState } from "react";
import { iconsLib } from "../../../../assets";
import { UPLOAD_SIZE_LIMITS } from "../../../../constants";
import { useLoading } from "../../../../contexts/LoadingContext";
import { useToast } from "../../../../contexts/ToastContext";
import { Button, FileInput, Image } from "../../../../design";
import {
  ButtonSizes,
  ButtonVariants,
  ComponentSizes,
} from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { Admin } from "../..";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import { ASSET_FORMATS, ASSET_TYPES } from "../../asset/constants";
import type { IAdminAsset } from "../../asset/types";
import {
  Dropdown,
  FormActionRow,
  FormContainer,
  TextInput,
} from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { ADMIN_LESSON_LEVELS, ADMIN_LESSON_UNITS } from "../constants";
import type { IAdminLesson, IAdminLessonFormValues } from "../types";

interface IAdminLessonFormProps {
  mode: typeof ADMIN_ACTIONS.CREATE | typeof ADMIN_ACTIONS.EDIT;
  lesson?: IAdminLesson | null;
  onSubmit: (values: IAdminLessonFormValues) => void;
  onCancel: () => void;
}

interface IAdminLessonFormState {
  title: string;
  level: string;
  unit: string;
}

type TImageSelection =
  | { source: "pick"; asset: IAdminAsset }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

const emptyValues: IAdminLessonFormState = {
  title: "",
  level: "",
  unit: "",
};

const buildInitialValues = (
  lesson?: IAdminLesson | null,
): IAdminLessonFormState => {
  if (!lesson) return emptyValues;
  return {
    title: lesson.title,
    level: lesson.level,
    unit: lesson.unit,
  };
};

export const AdminLessonForm: React.FC<IAdminLessonFormProps> = ({
  mode,
  lesson,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const { setLoading } = useLoading();

  const [values, setValues] = useState<IAdminLessonFormState>(() =>
    buildInitialValues(lesson),
  );
  const [titleError, setTitleError] = useState("");
  const [levelError, setLevelError] = useState("");
  const [unitError, setUnitError] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");
  const [imageSelection, setImageSelection] = useState<TImageSelection>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(
    lesson?.thumbnailUrl ?? null,
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const updateValue = <K extends keyof IAdminLessonFormState>(
    field: K,
    value: IAdminLessonFormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const clearImageSelection = () => {
    if (imageSelection?.source === "upload") {
      URL.revokeObjectURL(imageSelection.previewUrl);
    }
    setImageSelection(null);
    setThumbnailError("");
  };

  const clearThumbnail = () => {
    clearImageSelection();
    setExistingThumbnailUrl(null);
  };

  const validateImageFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      setThumbnailError(t(AppLocales.Admin.Lessons.Form.Errors.InvalidImage));
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
      setThumbnailError(
        t(AppLocales.Admin.Lessons.Form.Errors.ImageTooLarge, {
          size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
        }),
      );
      return false;
    }
    setThumbnailError("");
    return true;
  };

  const resolveThumbnailUrl = async (): Promise<string> => {
    if (imageSelection?.source === "pick") {
      return imageSelection.asset.url;
    }

    if (imageSelection?.source === "upload") {
      const uploadResult = await Admin.AssetController.uploadAsset(
        imageSelection.file,
        {
          type: ASSET_TYPES.THUMBNAIL,
          title: imageSelection.file.name.replace(/\.[^.]+$/, ""),
        },
      );
      if (!uploadResult.success || !uploadResult.asset) {
        toast.error(
          uploadResult.error ||
            t(AppLocales.Admin.Lessons.Form.Errors.UploadImage),
        );
        throw new Error("upload_failed");
      }
      return uploadResult.asset.url;
    }

    return existingThumbnailUrl ?? "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let isValid = true;
    if (!values.title.trim()) {
      setTitleError(t(AppLocales.Admin.Lessons.Form.TitleError));
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!values.level) {
      setLevelError(t(AppLocales.Admin.Lessons.Form.LevelError));
      isValid = false;
    } else {
      setLevelError("");
    }

    if (!values.unit) {
      setUnitError(t(AppLocales.Admin.Lessons.Form.UnitError));
      isValid = false;
    } else {
      setUnitError("");
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const thumbnailUrl = await resolveThumbnailUrl();
      onSubmit({
        title: values.title.trim(),
        level: values.level,
        unit: values.unit,
        thumbnailUrl,
      });
    } catch {
      // Upload failure already toasted.
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = ADMIN_LESSON_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));

  const unitOptions = ADMIN_LESSON_UNITS.map((unit) => ({
    value: unit,
    label: unit,
  }));

  const hasThumbnail =
    Boolean(imageSelection) || Boolean(existingThumbnailUrl && !imageSelection);

  const thumbnailPreviewUrl =
    imageSelection?.source === "pick"
      ? imageSelection.asset.url
      : imageSelection?.source === "upload"
        ? imageSelection.previewUrl
        : existingThumbnailUrl;

  return (
    <FormContainer onSubmit={(e) => void handleSubmit(e)}>
      <TextInput
        label={t(AppLocales.Admin.Lessons.Form.TitleLabel)}
        placeholder={t(AppLocales.Admin.Lessons.Form.TitlePlaceholder)}
        value={values.title}
        onChange={(e) => updateValue("title", e.target.value)}
        error={titleError}
        required
      />

      <Dropdown
        label={t(AppLocales.Admin.Lessons.Form.LevelLabel)}
        value={values.level}
        onValueChange={(value) => updateValue("level", value)}
        options={levelOptions}
        placeholder={t(AppLocales.Admin.Lessons.Form.LevelLabel)}
        error={levelError}
      />

      <Dropdown
        label={t(AppLocales.Admin.Lessons.Form.UnitLabel)}
        value={values.unit}
        onValueChange={(value) => updateValue("unit", value)}
        options={unitOptions}
        placeholder={t(AppLocales.Admin.Lessons.Form.UnitLabel)}
        error={unitError}
      />

      <div className="space-y-3">
        <p className="text-body-s font-medium text-base-content">
          {t(AppLocales.Admin.Lessons.Form.ThumbnailLabel)}
        </p>
        <p className="text-caption text-base-content/60">
          {t(AppLocales.Admin.Lessons.Form.ThumbnailHelper)}
        </p>

        {!hasThumbnail ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={ButtonVariants.SECONDARY}
                size={ButtonSizes.SM}
                onClick={() => setIsPickerOpen(true)}
              >
                <iconsLib.photo className="mr-1.5 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.Form.PickButton)}
              </Button>
            </div>
            <FileInput
              label={t(AppLocales.Admin.Lessons.Form.UploadLabel)}
              accept="image/*"
              buttonText={t(AppLocales.Admin.Lessons.Form.ChooseImage)}
              helperText={t(AppLocales.Admin.Lessons.Form.ImageHelper, {
                size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
              })}
              error={thumbnailError}
              onChange={(file) => {
                if (!file) {
                  clearImageSelection();
                  return;
                }
                if (!validateImageFile(file)) return;
                clearImageSelection();
                setExistingThumbnailUrl(null);
                setImageSelection({
                  source: "upload",
                  file,
                  previewUrl: URL.createObjectURL(file),
                });
              }}
            />
          </>
        ) : (
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3">
            {thumbnailPreviewUrl ? (
              <Image
                src={thumbnailPreviewUrl}
                alt=""
                className="h-20 w-28 shrink-0 rounded-lg object-cover border border-base-300"
              />
            ) : (
              <div className="h-20 w-28 shrink-0 rounded-lg border border-base-300 bg-base-200" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-body-s font-semibold truncate">
                {imageSelection?.source === "pick"
                  ? imageSelection.asset.title || imageSelection.asset.name
                  : imageSelection?.source === "upload"
                    ? imageSelection.file.name
                    : t(AppLocales.Admin.Lessons.Form.ExistingImage)}
              </p>
              <p className="text-caption text-base-content/60">
                {imageSelection?.source === "pick"
                  ? t(AppLocales.Admin.Lessons.Form.PickedImage)
                  : imageSelection?.source === "upload"
                    ? t(AppLocales.Admin.Lessons.Form.LocalImageSelected)
                    : t(AppLocales.Admin.Lessons.Form.ExistingImage)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size={ComponentSizes.SM}
                  variant={ButtonVariants.SECONDARY}
                  onClick={() => setIsPickerOpen(true)}
                >
                  <iconsLib.photo className="mr-1.5 h-4 w-4" />
                  {t(AppLocales.Admin.Lessons.Form.PickButton)}
                </Button>
                <Button
                  type="button"
                  size={ComponentSizes.SM}
                  variant={ButtonVariants.TERTIARY}
                  className="text-error hover:bg-error/10"
                  onClick={clearThumbnail}
                >
                  {t(AppLocales.Admin.Lessons.Form.ClearImage)}
                </Button>
              </div>
            </div>
          </div>
        )}
        {thumbnailError && hasThumbnail ? (
          <p className="text-caption text-error">{thumbnailError}</p>
        ) : null}
      </div>

      <FormActionRow
        onCancel={onCancel}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        submitLabel={
          mode === ADMIN_ACTIONS.CREATE
            ? t(AppLocales.Admin.Lessons.Form.CreateLesson)
            : t(AppLocales.Admin.Lessons.Form.SaveLesson)
        }
      />

      <AdminAssetSelectDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assetType={ASSET_TYPES.THUMBNAIL}
        format={ASSET_FORMATS.IMAGE}
        title={t(AppLocales.Admin.Lessons.Form.PickerTitle)}
        selectedAssetId={
          imageSelection?.source === "pick" ? imageSelection.asset.id : undefined
        }
        onSelect={(asset) => {
          clearImageSelection();
          setExistingThumbnailUrl(null);
          setImageSelection({ source: "pick", asset });
          setThumbnailError("");
        }}
      />
    </FormContainer>
  );
};
