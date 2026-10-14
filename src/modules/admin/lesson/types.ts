import type { IAsset } from "../../../models";
import type { TSortOrder } from "../../../hooks/useSort";

export const LESSON_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
} as const;

export type TLessonStatus =
  (typeof LESSON_STATUSES)[keyof typeof LESSON_STATUSES];

export const QUESTION_KINDS = {
  MULTIPLE_CHOICE: "multiple_choice",
} as const;

export type TQuestionKind =
  (typeof QUESTION_KINDS)[keyof typeof QUESTION_KINDS];

export type IAdminLessonAsset = IAsset;

export interface IAdminLessonVocabulary {
  id: string;
  vocab: string;
  vowel_symbol: string | null;
  position: number;
  image_asset_id: string | null;
  image: IAdminLessonAsset | null;
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonWordFamily {
  id: string;
  pattern: string;
  words: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonQuestionOption {
  id: string;
  text: string;
  correct: boolean;
  position: number;
  image_asset_id: string | null;
  image: IAdminLessonAsset | null;
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonQuestion {
  id: string;
  kind: TQuestionKind;
  title: string;
  position: number;
  options: IAdminLessonQuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonSortHealthChoice {
  id: string;
  label: string;
  position: number;
  items: IAdminLessonVocabulary[];
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonBuildSentencePair {
  vocab: string;
  sentence: string;
}

export interface IAdminLesson {
  id: string;
  title: string;
  level: number;
  unit: string;
  status: TLessonStatus;
  story_order: string[];
  build_the_sentences: IAdminLessonBuildSentencePair[];
  song_asset_id: string | null;
  song: IAdminLessonAsset | null;
  story_asset_id: string | null;
  story: IAdminLessonAsset | null;
  vocabularies: IAdminLessonVocabulary[];
  word_families: IAdminLessonWordFamily[];
  questions: IAdminLessonQuestion[];
  sort_health_choices: IAdminLessonSortHealthChoice[];
  discarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonWritePayload {
  title?: string;
  level?: number;
  unit?: string;
  status?: TLessonStatus;
  story_order?: string[];
  build_the_sentences?: IAdminLessonBuildSentencePair[];
  song_asset_id?: string | null;
  story_asset_id?: string | null;
  thumbnail_asset_id?: string | null;
  vocabularies?: IAdminLessonVocabularyWrite[];
  word_families?: IAdminLessonWordFamilyWrite[];
  questions?: IAdminLessonQuestionWrite[];
  sort_health_choices?: IAdminLessonSortHealthChoiceWrite[];
}

export interface IAdminLessonVocabularyWrite {
  id?: string;
  vocab: string;
  vowel_symbol?: string | null;
  image_asset_id?: string | null;
}

export interface IAdminLessonWordFamilyWrite {
  id?: string;
  pattern: string;
  words: string[];
}

export interface IAdminLessonQuestionOptionWrite {
  id?: string;
  text: string;
  correct: boolean;
  image_asset_id?: string | null;
}

export interface IAdminLessonQuestionWrite {
  id?: string;
  title: string;
  kind?: TQuestionKind;
  options: IAdminLessonQuestionOptionWrite[];
}

export interface IAdminLessonSortHealthItemWrite {
  id?: string;
  vocab: string;
  image_asset_id?: string | null;
}

export interface IAdminLessonSortHealthChoiceWrite {
  id?: string;
  label: string;
  items: IAdminLessonSortHealthItemWrite[];
}

export interface IAdminLessonMediaFiles {
  audio?: File;
  srt?: File;
  video?: File;
  video_srt?: File;
  thumbnail?: File;
}

export interface IAdminLessonFormValues {
  title: string;
  level: number;
  unit: string;
  status: TLessonStatus;
}

export interface IAdminLessonListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TLessonStatus | "";
  level?: number | string;
  unit?: string;
  discarded?: boolean;
  sort_by?: string;
  sort_order?: TSortOrder;
}

export interface IAdminLessonFilters {
  status: string;
  level: string;
  unit: string;
}

export interface IAdminLessonAiQueueResult {
  lesson_id: string;
  operation_id: string;
}

export type TLessonAiSocketType =
  | "lesson_word_families_generated"
  | "lesson_word_families_failed"
  | "lesson_story_order_generated"
  | "lesson_story_order_failed"
  | "lesson_build_the_sentences_generated"
  | "lesson_build_the_sentences_failed";

export interface ILessonAiSocketData {
  type: TLessonAiSocketType;
  lesson_id: string;
  run_id?: string;
  error?: string;
  word_families?: Array<{ pattern: string; words: string[] }>;
  story_order?: string[];
  build_the_sentences?: Array<{ vocab: string; sentence: string }>;
}
