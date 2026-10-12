import React, { useEffect, useState } from "react";
import { iconsLib } from "../../../../assets";
import { Button, Dialog, Toggle } from "../../../../design";
import {
  ButtonSizes,
  ButtonVariants,
  ComponentSizes,
} from "../../../../design/constants";
import { useToast } from "../../../../contexts/ToastContext";
import { AppLocales, useTranslate } from "../../../../locales";
import { Dropdown } from "../../components";
import {
  ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES,
} from "../constants";
import { getLessonHomework, saveLessonHomework } from "../lesson.mock.store";
import type {
  IAdminLesson,
  IAdminLessonHomeworkConfig,
  TAdminLessonHomeworkActivityType,
} from "../types";

interface IAdminLessonAssignHomeworkDialogProps {
  lesson: IAdminLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ACTIVITY_LOCALE_KEYS: Record<
  TAdminLessonHomeworkActivityType,
  string
> = {
  listen_and_tap: AppLocales.Admin.Lessons.AssignHomework.Activities.ListenAndTap,
  speak_and_record:
    AppLocales.Admin.Lessons.AssignHomework.Activities.SpeakAndRecord,
  trace_and_write:
    AppLocales.Admin.Lessons.AssignHomework.Activities.TraceAndWrite,
  blend_the_sound:
    AppLocales.Admin.Lessons.AssignHomework.Activities.BlendTheSound,
  sort_the_word_families:
    AppLocales.Admin.Lessons.AssignHomework.Activities.SortTheWordFamilies,
  read_a_story: AppLocales.Admin.Lessons.AssignHomework.Activities.ReadAStory,
  sing_and_chant:
    AppLocales.Admin.Lessons.AssignHomework.Activities.SingAndChant,
  put_the_story_in_order:
    AppLocales.Admin.Lessons.AssignHomework.Activities.PutTheStoryInOrder,
  build_the_sentences:
    AppLocales.Admin.Lessons.AssignHomework.Activities.BuildTheSentences,
  made_good_choice:
    AppLocales.Admin.Lessons.AssignHomework.Activities.MadeGoodChoice,
  sort_healthy_choices:
    AppLocales.Admin.Lessons.AssignHomework.Activities.SortHealthyChoices,
};

const emptyConfig = (): IAdminLessonHomeworkConfig => ({
  playSongFirst: false,
  playStory: false,
  activityTypes: [],
});

export const AdminLessonAssignHomeworkDialog: React.FC<
  IAdminLessonAssignHomeworkDialogProps
> = ({ lesson, isOpen, onClose, onSaved }) => {
  const t = useTranslate();
  const toast = useToast();

  const [playSongFirst, setPlaySongFirst] = useState(false);
  const [playStory, setPlayStory] = useState(false);
  const [activityTypes, setActivityTypes] = useState<
    TAdminLessonHomeworkActivityType[]
  >([]);
  const [activityToAdd, setActivityToAdd] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !lesson) return;
    const existing = getLessonHomework(lesson.id) ?? emptyConfig();
    setPlaySongFirst(existing.playSongFirst);
    setPlayStory(existing.playStory);
    setActivityTypes([...existing.activityTypes]);
    setActivityToAdd("");
  }, [isOpen, lesson]);

  const activityLabel = (type: TAdminLessonHomeworkActivityType) =>
    t(ACTIVITY_LOCALE_KEYS[type]);

  const remainingOptions = ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES.filter(
    (type) => !activityTypes.includes(type),
  ).map((type) => ({
    value: type,
    label: activityLabel(type),
  }));

  const handleAddActivity = () => {
    if (!activityToAdd) return;
    const type = activityToAdd as TAdminLessonHomeworkActivityType;
    if (!ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES.includes(type)) return;
    if (activityTypes.includes(type)) return;
    setActivityTypes((current) => [...current, type]);
    setActivityToAdd("");
  };

  const handleRemoveActivity = (type: TAdminLessonHomeworkActivityType) => {
    setActivityTypes((current) => current.filter((item) => item !== type));
  };

  const moveActivity = (index: number, direction: -1 | 1) => {
    setActivityTypes((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const handleSave = () => {
    if (!lesson) return;
    setIsSaving(true);
    const saved = saveLessonHomework(lesson.id, {
      playSongFirst,
      playStory,
      activityTypes,
    });
    setIsSaving(false);

    if (!saved) {
      toast.error(t(AppLocales.Admin.Lessons.AssignHomework.Errors.Save));
      return;
    }

    toast.success(t(AppLocales.Admin.Lessons.AssignHomework.Toasts.SaveSuccess));
    onSaved();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen && Boolean(lesson)}
      onClose={onClose}
      title={t(AppLocales.Admin.Lessons.AssignHomework.Title)}
      className="max-w-lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant={ButtonVariants.TERTIARY}
            onClick={onClose}
            disabled={isSaving}
          >
            {t(AppLocales.Admin.Common.Actions.Cancel)}
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {t(AppLocales.Admin.Lessons.AssignHomework.SaveButton)}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {lesson ? (
          <p className="text-body-s text-base-content/70">
            {t(AppLocales.Admin.Lessons.AssignHomework.LessonLabel, {
              title: lesson.title,
            })}
          </p>
        ) : null}

        <div className="space-y-4 rounded-xl border border-base-300 bg-base-200/30 p-4">
          <div className="py-1">
            <Toggle
              checked={playSongFirst}
              onCheckedChange={setPlaySongFirst}
              label={t(AppLocales.Admin.Lessons.AssignHomework.PlaySongFirst)}
              size={ComponentSizes.SM}
            />
          </div>
          <div className="border-t border-base-300 pt-4">
            <Toggle
              checked={playStory}
              onCheckedChange={setPlayStory}
              label={t(AppLocales.Admin.Lessons.AssignHomework.PlayStory)}
              size={ComponentSizes.SM}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-body-s font-medium text-base-content">
                {t(AppLocales.Admin.Lessons.AssignHomework.ActivitiesLabel)}
              </p>
              <p className="text-caption text-base-content/60">
                {t(AppLocales.Admin.Lessons.AssignHomework.ActivitiesHint)}
              </p>
            </div>
            <p className="text-caption text-base-content/60 shrink-0">
              {t(AppLocales.Admin.Lessons.AssignHomework.ActivitiesCount, {
                count: activityTypes.length,
                max: ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES.length,
              })}
            </p>
          </div>

          {remainingOptions.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Dropdown
                className="min-w-0 flex-1"
                label={t(AppLocales.Admin.Lessons.AssignHomework.AddActivityLabel)}
                placeholder={t(
                  AppLocales.Admin.Lessons.AssignHomework.AddActivityPlaceholder,
                )}
                value={activityToAdd}
                onValueChange={setActivityToAdd}
                options={remainingOptions}
              />
              <Button
                className="sm:mb-1"
                size={ButtonSizes.SM}
                variant={ButtonVariants.SECONDARY}
                onClick={handleAddActivity}
                disabled={!activityToAdd}
              >
                <iconsLib.plus className="mr-1 h-4 w-4" />
                {t(AppLocales.Admin.Lessons.AssignHomework.AddActivity)}
              </Button>
            </div>
          ) : (
            <p className="text-caption text-base-content/60">
              {t(AppLocales.Admin.Lessons.AssignHomework.AllActivitiesAdded)}
            </p>
          )}

          {activityTypes.length === 0 ? (
            <p className="text-body-s text-base-content/60 py-3 text-center rounded-lg border border-dashed border-base-300">
              {t(AppLocales.Admin.Lessons.AssignHomework.EmptyActivities)}
            </p>
          ) : (
            <ul className="space-y-2">
              {activityTypes.map((type, index) => (
                <li
                  key={type}
                  className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-2.5"
                >
                  <span className="text-caption text-base-content/40 w-5 shrink-0 text-center">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-body-s font-medium text-base-content">
                    {activityLabel(type)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="h-8 w-8 p-0"
                      aria-label={t(
                        AppLocales.Admin.Lessons.AssignHomework.MoveUp,
                      )}
                      disabled={index === 0}
                      onClick={() => moveActivity(index, -1)}
                    >
                      <iconsLib.chevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="h-8 w-8 p-0"
                      aria-label={t(
                        AppLocales.Admin.Lessons.AssignHomework.MoveDown,
                      )}
                      disabled={index === activityTypes.length - 1}
                      onClick={() => moveActivity(index, 1)}
                    >
                      <iconsLib.chevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size={ButtonSizes.SM}
                      variant={ButtonVariants.TERTIARY}
                      className="h-8 w-8 p-0 border border-error/30 text-error hover:bg-error/10"
                      aria-label={t(AppLocales.Admin.Common.Actions.Destroy)}
                      onClick={() => handleRemoveActivity(type)}
                    >
                      <iconsLib.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
};
