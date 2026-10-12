import React, { useState } from "react";
import { iconsLib } from "../../../../assets";
import {
  Badge,
  Button,
  DateTime,
  DateTimeFormats,
  DetailSection,
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
import { ConfirmDialog, Dropdown, TextArea } from "../../components";
import { MOCK_LESSON_SONG_AI_PROFILES } from "../constants";
import {
  clearLessonSong,
  generateMockLessonSong,
} from "../lesson.mock.store";
import type { IAdminLessonSong } from "../types";

interface IAdminLessonSongsSectionProps {
  lessonId: string;
  song: IAdminLessonSong | null;
  onSongChange: () => void;
}

export const AdminLessonSongsSection: React.FC<
  IAdminLessonSongsSectionProps
> = ({ lessonId, song, onSongChange }) => {
  const t = useTranslate();
  const toast = useToast();

  const [text, setText] = useState("");
  const [aiProfileId, setAiProfileId] = useState(
    MOCK_LESSON_SONG_AI_PROFILES[0]?.id ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const profileOptions = MOCK_LESSON_SONG_AI_PROFILES.map((profile) => ({
    value: profile.id,
    label: profile.name,
  }));

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateMockLessonSong(lessonId, {
      text,
      aiProfileId,
    });
    setIsGenerating(false);

    if (!result.success) {
      if (result.error === "text_required") {
        toast.error(t(AppLocales.Admin.Lessons.Songs.Errors.TextRequired));
      } else if (result.error === "profile_required") {
        toast.error(t(AppLocales.Admin.Lessons.Songs.Errors.ProfileRequired));
      } else {
        toast.error(t(AppLocales.Admin.Lessons.Songs.Errors.Generate));
      }
      return;
    }

    toast.success(t(AppLocales.Admin.Lessons.Songs.Toasts.GenerateSuccess));
    setText("");
    onSongChange();
  };

  const handleDelete = () => {
    const ok = clearLessonSong(lessonId);
    setIsDeleteOpen(false);
    if (ok) {
      toast.success(t(AppLocales.Admin.Lessons.Songs.Toasts.DeleteSuccess));
      onSongChange();
    } else {
      toast.error(t(AppLocales.Admin.Lessons.Songs.Errors.Delete));
    }
  };

  return (
    <>
      <DetailSection
        accent
        title={t(AppLocales.Admin.Lessons.Songs.Title)}
        description={t(AppLocales.Admin.Lessons.Songs.Description)}
        icon={iconsLib.sparkles}
        badge={
          <Badge variant={BadgeVariants.WARNING} size={ComponentSizes.SM}>
            {t(AppLocales.Admin.Lessons.Songs.PlaceholderBadge)}
          </Badge>
        }
      >
        <div className="space-y-6">
          {!song ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200/30 p-4 space-y-4">
              <p className="text-body-s text-base-content/70">
                {t(AppLocales.Admin.Lessons.Songs.GenerateHint)}
              </p>
              <div className="grid gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)_auto] lg:items-end">
                <TextArea
                  label={t(AppLocales.Admin.Lessons.Songs.TextLabel)}
                  placeholder={t(
                    AppLocales.Admin.Lessons.Songs.TextPlaceholder,
                  )}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                />
                <Dropdown
                  label={t(AppLocales.Admin.Lessons.Songs.ProfileLabel)}
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
                  {t(AppLocales.Admin.Lessons.Songs.GenerateButton)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-body-m font-semibold text-base-content whitespace-pre-wrap">
                    {song.text}
                  </p>
                  <p className="text-caption text-base-content/60">
                    {song.aiProfileName}
                    {" · "}
                    <DateTime
                      value={song.createdAt}
                      format={DateTimeFormats.ADMIN}
                    />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.SECONDARY}
                    onClick={() => {
                      setText(song.text);
                      setAiProfileId(song.aiProfileId);
                      void clearLessonSong(lessonId);
                      onSongChange();
                    }}
                  >
                    {t(AppLocales.Admin.Lessons.Songs.RegenerateButton)}
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

              <Player
                view="audio"
                src={song.audioUrl}
                title={t(AppLocales.Admin.Lessons.Songs.PreviewTitle)}
                tracks={[
                  {
                    content: song.srtContent,
                    type: "srt",
                    kind: "subtitles",
                    label: "SRT",
                    default: true,
                  },
                ]}
              />

              <details className="text-body-s">
                <summary className="cursor-pointer text-base-content/70 hover:text-base-content">
                  {t(AppLocales.Admin.Lessons.Songs.ViewSrt)}
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-base-200 p-3 font-mono text-caption whitespace-pre-wrap">
                  {song.srtContent}
                </pre>
              </details>
            </div>
          )}
        </div>
      </DetailSection>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t(AppLocales.Admin.Lessons.Songs.Confirm.DeleteTitle)}
        message={t(AppLocales.Admin.Lessons.Songs.Confirm.DeleteMessage)}
        confirmLabel={t(AppLocales.Admin.Common.Actions.Destroy)}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        isDestructive
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
