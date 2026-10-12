import React, { useEffect, useState } from "react";
import AppConfig from "../../../../AppConfig";
import { iconsLib } from "../../../../assets";
import { UPLOAD_SIZE_LIMITS } from "../../../../constants";
import {
  Badge,
  Button,
  DetailSection,
  FileInput,
  Player,
} from "../../../../design";
import {
  BadgeVariants,
  ButtonSizes,
  ButtonVariants,
  ComponentSizes,
} from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import type {
  IAsset,
  IAssetChild,
  IAssetPlaybackResponse,
} from "../../../../models";
import { AssetController } from "../../../asset";
import { ConfirmDialog } from "../../components";
import { Admin } from "../..";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import {
  ASSET_FORMATS,
  ASSET_TYPES,
  isSrtSubtitleFile,
} from "../../asset/constants";
import type { IAdminAsset } from "../../asset/types";
import {
  clearLessonStoryVideo,
  setLessonStoryVideo,
} from "../lesson.mock.store";
import type { IAdminLessonStoryVideo } from "../types";

interface IAdminLessonStoryVideoSectionProps {
  lessonId: string;
  storyVideo: IAdminLessonStoryVideo | null;
  onStoryChange: () => void;
}

/** Same subtitle src resolution as Test Lab Player usage. */
const resolveSubtitleSrc = (subtitle: IAssetChild | null): string | null => {
  if (!subtitle) return null;
  if (subtitle.core_url) {
    return subtitle.core_url.startsWith("http")
      ? subtitle.core_url
      : `${AppConfig.SERVER_BASE_URL}${subtitle.core_url}`;
  }
  return subtitle.url || null;
};

const toStoryVideo = (
  asset: IAdminAsset | IAsset,
  subtitleContentOverride: string | null = null,
): IAdminLessonStoryVideo => {
  const subtitle = asset.children?.subtitles?.[0] ?? null;
  return {
    videoAssetId: asset.id,
    videoUrl: asset.url,
    title: asset.title || asset.name || null,
    subtitleAssetId: subtitle?.id ?? null,
    subtitleUrl: resolveSubtitleSrc(subtitle),
    subtitleContent: subtitleContentOverride ?? subtitle?.content ?? null,
  };
};

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsText(file);
  });

/** Same track mapping as design Test Lab. */
const buildPlaybackTracks = (playback: IAssetPlaybackResponse) =>
  playback.media.subtitles
    .filter((subtitle) =>
      Boolean(subtitle.content || subtitle.core_url || subtitle.url),
    )
    .map((subtitle, index) => {
      const fallbackUrl = subtitle.core_url
        ? subtitle.core_url.startsWith("http")
          ? subtitle.core_url
          : `${AppConfig.SERVER_BASE_URL}${subtitle.core_url}`
        : subtitle.url;

      return {
        src: fallbackUrl,
        content: subtitle.content,
        kind: "subtitles" as const,
        label: subtitle.title || subtitle.name || `Subtitle ${index + 1}`,
        default: index === 0,
      };
    });

export const AdminLessonStoryVideoSection: React.FC<
  IAdminLessonStoryVideoSectionProps
> = ({ lessonId, storyVideo, onStoryChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!storyVideo);
  const [pickedAsset, setPickedAsset] = useState<IAdminAsset | null>(null);
  const [isLoadingPick, setIsLoadingPick] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState("");
  const [srtError, setSrtError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [playback, setPlayback] = useState<IAssetPlaybackResponse | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  const showForm = isEditing || !storyVideo;

  useEffect(() => {
    if (!storyVideo?.videoAssetId || showForm) {
      setPlayback(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPlayback(true);
    setPlayback(null);

    void AssetController.getPlayback(storyVideo.videoAssetId).then((result) => {
      if (cancelled) return;
      setIsLoadingPlayback(false);
      if (result.success && result.playback) {
        setPlayback(result.playback);
      } else {
        setPlayback(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storyVideo?.videoAssetId, showForm]);

  const resetForm = () => {
    setPickedAsset(null);
    setVideoFile(null);
    setSrtFile(null);
    setVideoError("");
    setSrtError("");
  };

  const openEditor = () => {
    resetForm();
    setIsEditing(true);
  };

  const validateSrt = (file: File | null): boolean => {
    if (!file) {
      setSrtError("");
      return true;
    }
    if (!isSrtSubtitleFile(file)) {
      setSrtError(t(AppLocales.Admin.Lessons.Story.Errors.InvalidSrt));
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_BYTES) {
      setSrtError(
        t(AppLocales.Admin.Lessons.Story.Errors.SrtTooLarge, {
          size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
        }),
      );
      return false;
    }
    setSrtError("");
    return true;
  };

  const validateVideoFile = (file: File | null): boolean => {
    if (!file) return true;
    if (!file.type.startsWith("video/")) {
      setVideoError(t(AppLocales.Admin.Lessons.Story.Errors.InvalidVideo));
      return false;
    }
    if (file.size > UPLOAD_SIZE_LIMITS.MAX_VIDEO_BYTES) {
      setVideoError(
        t(AppLocales.Admin.Lessons.Story.Errors.VideoTooLarge, {
          size: UPLOAD_SIZE_LIMITS.MAX_VIDEO_SIZE_MB,
        }),
      );
      return false;
    }
    setVideoError("");
    return true;
  };

  const persistStoryFromAsset = async (
    assetId: string,
    optionalSrt?: File | null,
  ): Promise<boolean> => {
    let localSrtContent: string | null = null;

    if (optionalSrt) {
      if (!validateSrt(optionalSrt)) return false;
      try {
        localSrtContent = await readFileAsText(optionalSrt);
      } catch {
        localSrtContent = null;
      }
      const subtitleResult = await Admin.AssetController.uploadSubtitle(
        assetId,
        optionalSrt,
      );
      if (!subtitleResult.success) {
        toast.error(
          subtitleResult.error ||
            t(AppLocales.Admin.Lessons.Story.Errors.UploadSrt),
        );
        return false;
      }
    }

    const detail = await Admin.AssetController.getAsset(assetId);
    if (!detail.success || !detail.asset) {
      toast.error(
        detail.error || t(AppLocales.Admin.Lessons.Story.Errors.LoadAsset),
      );
      return false;
    }

    setLessonStoryVideo(lessonId, toStoryVideo(detail.asset, localSrtContent));
    return true;
  };

  const handleSave = async () => {
    setVideoError("");
    setSrtError("");

    if (!pickedAsset && !videoFile) {
      setVideoError(t(AppLocales.Admin.Lessons.Story.Errors.VideoRequired));
      return;
    }

    if (videoFile && !validateVideoFile(videoFile)) return;
    if (srtFile && !validateSrt(srtFile)) return;

    setIsSaving(true);

    try {
      if (pickedAsset) {
        const ok = await persistStoryFromAsset(pickedAsset.id, srtFile);
        if (!ok) return;
      } else if (videoFile) {
        const uploadResult = await Admin.AssetController.uploadAsset(
          videoFile,
          {
            type: ASSET_TYPES.GENERAL,
            title: videoFile.name.replace(/\.[^.]+$/, ""),
          },
        );
        if (!uploadResult.success || !uploadResult.asset) {
          toast.error(
            uploadResult.error ||
              t(AppLocales.Admin.Lessons.Story.Errors.UploadVideo),
          );
          return;
        }

        const ok = await persistStoryFromAsset(
          uploadResult.asset.id,
          srtFile,
        );
        if (!ok) return;
      }

      toast.success(t(AppLocales.Admin.Lessons.Story.Toasts.AttachSuccess));
      resetForm();
      setIsEditing(false);
      onStoryChange();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    const ok = clearLessonStoryVideo(lessonId);
    setIsRemoveOpen(false);
    if (ok) {
      toast.success(t(AppLocales.Admin.Lessons.Story.Toasts.RemoveSuccess));
      setIsEditing(true);
      resetForm();
      onStoryChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.Story.Errors.Remove));
    }
  };

  const pickedHasSubtitle = Boolean(
    pickedAsset?.children?.subtitles &&
      pickedAsset.children.subtitles.length > 0,
  );
  // SRT chooser: only for new upload, or pick when asset has no subtitle child yet
  const showSrtChooser = Boolean(videoFile) || (pickedAsset && !pickedHasSubtitle);

  const playbackTracks = playback ? buildPlaybackTracks(playback) : [];
  const hasSubtitles =
    playbackTracks.length > 0 ||
    Boolean(storyVideo?.subtitleContent || storyVideo?.subtitleUrl);

  const handlePickAsset = async (asset: IAdminAsset) => {
    setVideoFile(null);
    setSrtFile(null);
    setVideoError("");
    setSrtError("");
    setIsEditing(true);
    setIsLoadingPick(true);
    try {
      const detail = await Admin.AssetController.getAsset(asset.id);
      if (detail.success && detail.asset) {
        setPickedAsset(detail.asset);
      } else {
        setPickedAsset(asset);
        toast.error(
          detail.error || t(AppLocales.Admin.Lessons.Story.Errors.LoadAsset),
        );
      }
    } finally {
      setIsLoadingPick(false);
    }
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.Story.Title)}
        description={t(AppLocales.Admin.Lessons.Story.Description)}
        icon={iconsLib.photo}
        badge={
          <Badge variant={BadgeVariants.PRIMARY} size={ComponentSizes.SM}>
            {t(AppLocales.Admin.Lessons.Story.TypeBadge)}
          </Badge>
        }
        actions={
          storyVideo && !showForm ? (
            <div className="flex gap-2">
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.SECONDARY}
                onClick={openEditor}
              >
                {t(AppLocales.Admin.Lessons.Story.ReplaceButton)}
              </Button>
              <Button
                size={ButtonSizes.SM}
                variant={ButtonVariants.TERTIARY}
                className="border border-error/30 text-error hover:bg-error/10"
                onClick={() => setIsRemoveOpen(true)}
              >
                <iconsLib.trash className="h-4 w-4" />
              </Button>
            </div>
          ) : null
        }
      >
        <div className="space-y-6">
          {storyVideo && !showForm ? (
            <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-body-m font-semibold text-base-content">
                  {storyVideo.title ||
                    t(AppLocales.Admin.Lessons.Story.Untitled)}
                </p>
                <p className="text-caption font-mono text-base-content/60">
                  {storyVideo.videoAssetId}
                </p>
              </div>

              {isLoadingPlayback ? (
                <p className="text-body-s text-base-content/60">
                  {t(AppLocales.Common.Loading)}
                </p>
              ) : (
                <Player
                  view="video"
                  src={playback?.delivery.url ?? storyVideo.videoUrl}
                  type={playback?.media.content_type}
                  title={
                    storyVideo.title ||
                    t(AppLocales.Admin.Lessons.Story.PreviewTitle)
                  }
                  className="aspect-video w-full rounded-lg border border-base-300 bg-base-300 object-contain"
                  tracks={
                    playbackTracks.length > 0
                      ? playbackTracks
                      : storyVideo.subtitleContent || storyVideo.subtitleUrl
                        ? [
                            {
                              src: storyVideo.subtitleUrl ?? undefined,
                              content: storyVideo.subtitleContent,
                              kind: "subtitles",
                              label: "SRT",
                              default: true,
                            },
                          ]
                        : undefined
                  }
                />
              )}

              {!isLoadingPlayback && !hasSubtitles ? (
                <p className="text-body-s text-base-content/60">
                  {t(AppLocales.Admin.Lessons.Story.NoSubtitle)}
                </p>
              ) : null}
            </div>
          ) : null}

          {showForm ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <p className="text-body-s text-base-content/70">
                {t(AppLocales.Admin.Lessons.Story.AttachHint)}
              </p>

              <div className="flex flex-wrap gap-2">
                {!videoFile ? (
                  <Button
                    variant={ButtonVariants.SECONDARY}
                    onClick={() => setIsPickerOpen(true)}
                  >
                    <iconsLib.photo className="mr-2 h-4 w-4" />
                    {t(AppLocales.Admin.Lessons.Story.PickButton)}
                  </Button>
                ) : null}
                {pickedAsset ? (
                  <Button
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => setPickedAsset(null)}
                  >
                    {t(AppLocales.Admin.Lessons.Story.ClearPick)}
                  </Button>
                ) : null}
                {videoFile ? (
                  <Button
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => {
                      setVideoFile(null);
                      setVideoError("");
                      setSrtFile(null);
                      setSrtError("");
                    }}
                  >
                    {t(AppLocales.Admin.Lessons.Story.ClearVideo)}
                  </Button>
                ) : null}
                {storyVideo ? (
                  <Button
                    variant={ButtonVariants.TERTIARY}
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                  >
                    {t(AppLocales.Admin.Common.Actions.Cancel)}
                  </Button>
                ) : null}
              </div>

              {pickedAsset ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-body-s space-y-1">
                  <div>
                    <span className="font-semibold">
                      {pickedAsset.title || pickedAsset.name}
                    </span>
                    <span className="ml-2 font-mono text-caption opacity-70">
                      {pickedAsset.id}
                    </span>
                  </div>
                  {pickedHasSubtitle ? (
                    <p className="text-caption text-success">
                      {t(AppLocales.Admin.Lessons.Story.ExistingSubtitle)}
                    </p>
                  ) : null}
                </div>
              ) : videoFile ? (
                <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-body-s">
                  <span className="font-semibold">{videoFile.name}</span>
                  <span className="ml-2 text-caption text-base-content/60">
                    {t(AppLocales.Admin.Lessons.Story.LocalVideoSelected)}
                  </span>
                </div>
              ) : (
                <FileInput
                  label={t(AppLocales.Admin.Lessons.Story.VideoLabel)}
                  accept="video/*"
                  buttonText={t(AppLocales.Admin.Lessons.Story.ChooseVideo)}
                  helperText={t(AppLocales.Admin.Lessons.Story.VideoHelper, {
                    size: UPLOAD_SIZE_LIMITS.MAX_VIDEO_SIZE_MB,
                  })}
                  error={videoError}
                  onChange={(file) => {
                    setVideoFile(file);
                    setPickedAsset(null);
                    if (file) validateVideoFile(file);
                    else setVideoError("");
                  }}
                />
              )}

              {showSrtChooser ? (
                srtFile ? (
                  <div className="space-y-2">
                    <p className="text-body-s font-medium text-base-content">
                      {t(AppLocales.Admin.Lessons.Story.SrtLabel)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-body-s min-w-0 flex-1">
                        <span className="font-semibold">{srtFile.name}</span>
                        <span className="ml-2 text-caption text-base-content/60">
                          {t(AppLocales.Admin.Lessons.Story.LocalSrtSelected)}
                        </span>
                      </div>
                      <Button
                        variant={ButtonVariants.TERTIARY}
                        onClick={() => {
                          setSrtFile(null);
                          setSrtError("");
                        }}
                      >
                        {t(AppLocales.Admin.Lessons.Story.ClearSrt)}
                      </Button>
                    </div>
                    {srtError ? (
                      <p className="text-caption text-error">{srtError}</p>
                    ) : null}
                  </div>
                ) : (
                  <FileInput
                    label={t(AppLocales.Admin.Lessons.Story.SrtLabel)}
                    accept=".srt"
                    buttonText={t(AppLocales.Admin.Lessons.Story.ChooseSrt)}
                    helperText={t(AppLocales.Admin.Lessons.Story.SrtHelper)}
                    error={srtError}
                    onChange={(file) => {
                      setSrtFile(file);
                      if (file) validateSrt(file);
                      else setSrtError("");
                    }}
                  />
                )
              ) : null}

              <div className="flex justify-end">
                <Button
                  onClick={() => void handleSave()}
                  isLoading={isSaving || isLoadingPick}
                  disabled={isSaving || isLoadingPick || (!pickedAsset && !videoFile)}
                >
                  {t(AppLocales.Admin.Lessons.Story.AttachButton)}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DetailSection>

      <AdminAssetSelectDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.VIDEO}
        selectedAssetId={pickedAsset?.id ?? storyVideo?.videoAssetId}
        title={t(AppLocales.Admin.Lessons.Story.PickerTitle)}
        onSelect={(asset) => {
          void handlePickAsset(asset);
        }}
      />

      <ConfirmDialog
        isOpen={isRemoveOpen}
        title={t(AppLocales.Admin.Lessons.Story.Confirm.RemoveTitle)}
        message={t(AppLocales.Admin.Lessons.Story.Confirm.RemoveMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleRemove}
        onClose={() => setIsRemoveOpen(false)}
      />
    </>
  );
};
