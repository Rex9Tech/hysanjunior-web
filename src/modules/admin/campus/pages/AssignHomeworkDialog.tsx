import React, { useEffect, useMemo, useState } from "react";
import { iconsLib } from "../../../../assets";
import { Button, Dialog, Toggle } from "../../../../design";
import { ButtonSizes, ButtonVariants } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import { LESSON_STATUSES } from "../../lesson/types";
import LessonController from "../../lesson/lesson.controller";
import {
  ADMIN_HOMEWORK_ACTIVITY_KEYS,
} from "../constants";
import type {
  IAdminClassHomework,
  IAdminClassHomeworkFormValues,
  THomeworkActivityKey,
} from "../types";

interface IAssignHomeworkDialogProps {
  isOpen: boolean;
  schoolClassId: string;
  homework?: IAdminClassHomework | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: IAdminClassHomeworkFormValues) => void;
}

const emptyForm = {
  lessonId: "",
  activityKeys: [] as THomeworkActivityKey[],
  playSongAtFirst: false,
  playStoryAtFirst: false,
  title: "",
  dueOn: "",
};

export const AssignHomeworkDialog: React.FC<IAssignHomeworkDialogProps> = ({
  isOpen,
  schoolClassId,
  homework,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const t = useTranslate();
  const isEdit = Boolean(homework);
  const [lessonId, setLessonId] = useState(emptyForm.lessonId);
  const [activityKeys, setActivityKeys] = useState<THomeworkActivityKey[]>(
    emptyForm.activityKeys,
  );
  const [playSongAtFirst, setPlaySongAtFirst] = useState(
    emptyForm.playSongAtFirst,
  );
  const [playStoryAtFirst, setPlayStoryAtFirst] = useState(
    emptyForm.playStoryAtFirst,
  );
  const [title, setTitle] = useState(emptyForm.title);
  const [dueOn, setDueOn] = useState(emptyForm.dueOn);
  const [addKey, setAddKey] = useState("");
  const [lessons, setLessons] = useState<
    { id: string; title: string; level: number }[]
  >([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (homework) {
      setLessonId(homework.lesson_id);
      setActivityKeys([...(homework.activity_keys || [])]);
      setPlaySongAtFirst(Boolean(homework.play_song_at_first));
      setPlayStoryAtFirst(Boolean(homework.play_story_at_first));
      setTitle(homework.title || "");
      setDueOn(homework.due_on || "");
    } else {
      setLessonId("");
      setActivityKeys([]);
      setPlaySongAtFirst(false);
      setPlayStoryAtFirst(false);
      setTitle("");
      setDueOn("");
    }
    setAddKey("");
    setLoadError("");

    void (async () => {
      const result = await LessonController.getLessons({
        status: LESSON_STATUSES.PUBLISHED,
        limit: 100,
        sort_by: "title",
        sort_order: "asc",
      });
      if (result.success) {
        setLessons(
          result.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            level: lesson.level,
          })),
        );
      } else {
        setLoadError(
          result.error || t(AppLocales.Admin.Campuses.Errors.LoadLessons),
        );
      }
    })();
  }, [homework, isOpen, t]);

  const remainingKeys = useMemo(
    () =>
      ADMIN_HOMEWORK_ACTIVITY_KEYS.filter(
        (key) => !activityKeys.includes(key),
      ),
    [activityKeys],
  );

  const activityLabel = (key: THomeworkActivityKey) => {
    const labels = AppLocales.Admin.Campuses.Homework.Activities;
    return t(labels[key as keyof typeof labels]);
  };


  const moveActivity = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= activityKeys.length) return;
    setActivityKeys((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const handleAddActivity = () => {
    if (!addKey) return;
    if (!ADMIN_HOMEWORK_ACTIVITY_KEYS.includes(addKey as THomeworkActivityKey)) {
      return;
    }
    if (activityKeys.includes(addKey as THomeworkActivityKey)) return;
    setActivityKeys((current) => [...current, addKey as THomeworkActivityKey]);
    setAddKey("");
  };

  const canSubmit = Boolean(lessonId) && activityKeys.length > 0 && !isSubmitting;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? t(AppLocales.Admin.Campuses.Homework.EditTitle)
          : t(AppLocales.Admin.Campuses.Homework.AssignTitle)
      }
      className="max-w-lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant={ButtonVariants.TERTIARY}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t(AppLocales.Admin.Common.Actions.Cancel)}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                school_class_id: schoolClassId,
                lesson_id: lessonId,
                activity_keys: activityKeys,
                play_song_at_first: playSongAtFirst,
                play_story_at_first: playStoryAtFirst,
                title: title.trim() || null,
                due_on: dueOn || null,
              })
            }
          >
            {isEdit
              ? t(AppLocales.Admin.Campuses.Homework.Save)
              : t(AppLocales.Admin.Campuses.Homework.Assign)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {loadError ? (
          <p className="text-sm text-error">{loadError}</p>
        ) : null}

        <div>
          <label className="mb-1 block text-body-s font-medium">
            {t(AppLocales.Admin.Campuses.Homework.Lesson)}
          </label>
          <select
            className="select select-bordered w-full"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            disabled={isEdit}
          >
            <option value="">
              {t(AppLocales.Admin.Campuses.Homework.SelectLesson)}
            </option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {`L${lesson.level} · ${lesson.title}`}
              </option>
            ))}
            {isEdit &&
            homework?.lesson &&
            !lessons.some((lesson) => lesson.id === homework.lesson_id) ? (
              <option value={homework.lesson_id}>
                {`L${homework.lesson.level} · ${homework.lesson.title}`}
              </option>
            ) : null}
          </select>
        </div>

        <div className="space-y-2">
          <Toggle
            checked={playSongAtFirst}
            onCheckedChange={setPlaySongAtFirst}
            label={t(AppLocales.Admin.Campuses.Homework.PlaySongAtFirst)}
          />
          <Toggle
            checked={playStoryAtFirst}
            onCheckedChange={setPlayStoryAtFirst}
            label={t(AppLocales.Admin.Campuses.Homework.PlayStoryAtFirst)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-body-s font-medium">
            {t(AppLocales.Admin.Campuses.Homework.ActivitiesTitle)}
          </div>
          {activityKeys.length === 0 ? (
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Campuses.Homework.ActivitiesEmpty)}
            </p>
          ) : (
            <ul className="space-y-2">
              {activityKeys.map((key, index) => (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 text-sm">
                    {index + 1}. {activityLabel(key)}
                  </span>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    disabled={index === 0}
                    onClick={() => moveActivity(index, -1)}
                    aria-label={t(AppLocales.Admin.Campuses.Homework.MoveUp)}
                  >
                    <iconsLib.chevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    disabled={index === activityKeys.length - 1}
                    onClick={() => moveActivity(index, 1)}
                    aria-label={t(AppLocales.Admin.Campuses.Homework.MoveDown)}
                  >
                    <iconsLib.chevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size={ButtonSizes.SM}
                    variant={ButtonVariants.TERTIARY}
                    onClick={() =>
                      setActivityKeys((current) =>
                        current.filter((item) => item !== key),
                      )
                    }
                  >
                    {t(AppLocales.Admin.Campuses.Homework.Remove)}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {remainingKeys.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-body-s font-medium">
                  {t(AppLocales.Admin.Campuses.Homework.AddActivity)}
                </label>
                <select
                  className="select select-bordered w-full"
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                >
                  <option value="">
                    {t(AppLocales.Admin.Campuses.Homework.SelectActivity)}
                  </option>
                  {remainingKeys.map((key) => (
                    <option key={key} value={key}>
                      {activityLabel(key)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size={ButtonSizes.SM}
                disabled={!addKey}
                onClick={handleAddActivity}
              >
                {t(AppLocales.Admin.Campuses.Homework.Add)}
              </Button>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-body-s font-medium">
            {t(AppLocales.Admin.Campuses.Homework.TitleOptional)}
          </label>
          <input
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(AppLocales.Admin.Campuses.Homework.TitlePlaceholder)}
          />
        </div>

        <div>
          <label className="mb-1 block text-body-s font-medium">
            {t(AppLocales.Admin.Campuses.Homework.DueOn)}
          </label>
          <input
            type="date"
            className="input input-bordered w-full"
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
};
