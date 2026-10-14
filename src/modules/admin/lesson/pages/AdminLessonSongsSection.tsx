import React, { useEffect, useState } from "react";
import { iconsLib } from "../../../../assets";
import { UPLOAD_SIZE_LIMITS } from "../../../../constants";
import {
  Badge,
  Button,
  DetailSection,
  FileInput,
  StatusBadge,
} from "../../../../design";
import {
  BadgeVariants,
  ButtonSizes,
  ButtonVariants,
  ComponentSizes,
} from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import { SOCKET_MESSAGE_TYPES } from "../../../../helpers/socket.helpers";
import SocketService, {
  type ISocketMessage,
} from "../../../../services/socket.service";
import { NOTIFICATION_SOCKET_TYPES } from "../../../notification/constants";
import { Admin } from "../..";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import {
  ASSET_FORMATS,
  ASSET_STATUSES,
  ASSET_TYPES,
} from "../../asset/constants";
import type { IAdminAsset } from "../../asset/types";
import type { IAdminLesson, IAdminLessonAsset } from "../types";

interface IProps {
  lesson: IAdminLesson;
  onLessonChange: () => void;
}

const ASSET_STATUS_EVENTS = new Set<string>([
  NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSED,
  NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSION_FAILED,
  NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSING,
]);

export const AdminLessonSongsSection: React.FC<IProps> = ({
  lesson,
  onLessonChange,
}) => {
  const t = useTranslate();
  const toast = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [song, setSong] = useState<IAdminLessonAsset | null>(lesson.song);

  useEffect(() => {
    setSong(lesson.song);
  }, [lesson.song]);

  useEffect(() => {
    const assetId = song?.id || lesson.song_asset_id;
    if (!assetId) return;

    const handler = (message: ISocketMessage) => {
      if (message.type !== SOCKET_MESSAGE_TYPES.NOTIFICATION) return;
      const eventType =
        typeof message.data?.type === "string" ? message.data.type : "";
      if (!ASSET_STATUS_EVENTS.has(eventType)) return;

      const eventAssetId =
        typeof message.data?.asset_id === "string" ? message.data.asset_id : "";
      if (eventAssetId !== assetId) return;

      const status =
        typeof message.data?.status === "string"
          ? message.data.status
          : eventType === NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSING
            ? ASSET_STATUSES.PROCESSING
            : eventType === NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSION_FAILED
              ? ASSET_STATUSES.FAILED
              : "";
      const sizeBytes =
        typeof message.data?.size_bytes === "number"
          ? message.data.size_bytes
          : undefined;
      const url =
        typeof message.data?.url === "string" ? message.data.url : undefined;

      setSong((prev) =>
        prev
          ? {
              ...prev,
              status: status || prev.status,
              size_bytes:
                sizeBytes !== undefined ? sizeBytes : prev.size_bytes,
              url: url !== undefined ? url : prev.url,
            }
          : prev,
      );

      if (
        eventType === NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSED ||
        eventType === NOTIFICATION_SOCKET_TYPES.ASSET_COMPRESSION_FAILED
      ) {
        onLessonChange();
      }
    };

    SocketService.addListener(handler);
    return () => SocketService.removeListener(handler);
  }, [lesson.song_asset_id, onLessonChange, song?.id]);

  const handlePickAsset = async (asset: IAdminAsset) => {
    setIsSaving(true);
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      song_asset_id: asset.id,
    });
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    toast.success(t(AppLocales.Admin.Lessons.Songs.Toasts.SaveSuccess));
    onLessonChange();
  };

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error(t(AppLocales.Admin.Lessons.Songs.Errors.AudioRequired));
      return;
    }
    setIsSaving(true);
    const result = await Admin.LessonController.updateLesson(
      lesson.id,
      {},
      { audio: audioFile, srt: srtFile || undefined },
    );
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    setAudioFile(null);
    setSrtFile(null);
    toast.success(t(AppLocales.Admin.Lessons.Songs.Toasts.SaveSuccess));
    onLessonChange();
  };

  const handleClear = async () => {
    setIsSaving(true);
    const result = await Admin.LessonController.updateLesson(lesson.id, {
      song_asset_id: null,
    });
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || t(AppLocales.Admin.Lessons.Errors.Update));
      return;
    }
    toast.success(t(AppLocales.Admin.Lessons.Songs.Toasts.ClearSuccess));
    onLessonChange();
  };

  const subtitles = song?.children?.subtitles ?? [];

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.Songs.Title)}
        description={t(AppLocales.Admin.Lessons.Songs.Description)}
        icon={iconsLib.document}
        badge={
          song ? (
            <StatusBadge status={song.status || ASSET_STATUSES.PENDING} />
          ) : (
            <Badge variant={BadgeVariants.DEFAULT} size={ComponentSizes.SM}>
              {t(AppLocales.Admin.Lessons.Songs.EmptyBadge)}
            </Badge>
          )
        }
      >
        <div className="space-y-4">
          {song ? (
            <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-body-s font-medium min-w-0 flex-1">
                  {song.title || song.name || lesson.song_asset_id}
                </p>
                <StatusBadge status={song.status || ASSET_STATUSES.PENDING} />
              </div>
              {subtitles.length > 0 ? (
                <ul className="space-y-1.5">
                  {subtitles.map((subtitle) => (
                    <li
                      key={subtitle.id}
                      className="flex flex-wrap items-center gap-2 text-caption text-base-content/70"
                    >
                      <span className="truncate">
                        {subtitle.title || subtitle.name || "SRT"}
                      </span>
                      <StatusBadge
                        status={subtitle.status || ASSET_STATUSES.READY}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size={ButtonSizes.SM}
                  variant={ButtonVariants.SECONDARY}
                  onClick={() => setIsPickerOpen(true)}
                  disabled={isSaving}
                >
                  {t(AppLocales.Admin.Lessons.Songs.ReplaceButton)}
                </Button>
                <Button
                  size={ButtonSizes.SM}
                  variant={ButtonVariants.TERTIARY}
                  className="text-error"
                  onClick={() => void handleClear()}
                  disabled={isSaving}
                >
                  {t(AppLocales.Admin.Lessons.Songs.ClearButton)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <Button
                variant={ButtonVariants.SECONDARY}
                onClick={() => setIsPickerOpen(true)}
              >
                <iconsLib.photo className="mr-2 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.Songs.PickButton)}
              </Button>
              <FileInput
                label={t(AppLocales.Admin.Lessons.Songs.UploadAudioLabel)}
                accept="audio/*"
                buttonText={
                  audioFile?.name ||
                  t(AppLocales.Admin.Lessons.Songs.ChooseAudio)
                }
                helperText={t(AppLocales.Admin.Lessons.Songs.AudioHelper, {
                  size: UPLOAD_SIZE_LIMITS.MAX_NON_VIDEO_SIZE_MB,
                })}
                onChange={(file) => setAudioFile(file)}
              />
              <FileInput
                label={t(AppLocales.Admin.Lessons.Songs.UploadSrtLabel)}
                accept=".srt,text/plain"
                buttonText={
                  srtFile?.name || t(AppLocales.Admin.Lessons.Songs.ChooseSrt)
                }
                onChange={(file) => setSrtFile(file)}
              />
              <Button
                onClick={() => void handleUpload()}
                isLoading={isSaving}
                disabled={isSaving || !audioFile}
              >
                {t(AppLocales.Admin.Lessons.Songs.UploadButton)}
              </Button>
            </div>
          )}
        </div>
      </DetailSection>

      <AdminAssetSelectDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.AUDIO}
        title={t(AppLocales.Admin.Lessons.Songs.PickerTitle)}
        selectedAssetId={lesson.song_asset_id}
        onSelect={(asset) => {
          setIsPickerOpen(false);
          void handlePickAsset(asset);
        }}
      />
    </>
  );
};
