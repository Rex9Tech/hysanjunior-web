export interface IAdminLessonSong {
  id: string;
  lessonId: string;
  text: string;
  aiProfileId: string;
  aiProfileName: string;
  audioUrl: string;
  srtContent: string;
  createdAt: string;
}

export interface IAdminLessonStoryVideo {
  videoAssetId: string;
  videoUrl: string;
  title: string | null;
  subtitleAssetId: string | null;
  subtitleUrl: string | null;
  /** Inline SRT text for Player (avoids CORS on remote .srt URLs). */
  subtitleContent: string | null;
}

export interface IAdminLessonVocabItem {
  id: string;
  vocab: string;
  vowelSound: string;
  imageAssetId: string;
  imageUrl: string;
  createdAt: string;
}

export interface IAdminLessonWordFamily {
  id: string;
  title: string;
  words: string[];
}

export interface IAdminLessonWordFamilySet {
  aiProfileId: string;
  aiProfileName: string;
  createdAt: string;
  families: IAdminLessonWordFamily[];
}

export interface IAdminLessonStorySummary {
  aiProfileId: string;
  aiProfileName: string;
  createdAt: string;
  sentences: string[];
}

export interface IAdminLessonBuildSentenceItem {
  id: string;
  vocabId: string;
  vocab: string;
  sentence: string;
}

export interface IAdminLessonBuildSentenceSet {
  aiProfileId: string;
  aiProfileName: string;
  createdAt: string;
  items: IAdminLessonBuildSentenceItem[];
}

export interface IAdminLessonHealthyChoiceOption {
  id: string;
  text: string;
  imageAssetId: string;
  imageUrl: string;
}

export interface IAdminLessonHealthyChoiceQuestion {
  id: string;
  title: string;
  options: IAdminLessonHealthyChoiceOption[];
  correctOptionIds: string[];
  createdAt: string;
}

export type TAdminLessonSortHealthyBucketKey = "healthyFood" | "junkFood";

export interface IAdminLessonSortHealthyItem {
  id: string;
  text: string;
  imageAssetId: string;
  imageUrl: string;
}

export interface IAdminLessonSortHealthyBucket {
  title: string;
  items: IAdminLessonSortHealthyItem[];
}

export interface IAdminLessonSortHealthyChoice {
  healthyFood: IAdminLessonSortHealthyBucket;
  junkFood: IAdminLessonSortHealthyBucket;
}

export type TAdminLessonHomeworkActivityType =
  | "listen_and_tap"
  | "speak_and_record"
  | "trace_and_write"
  | "blend_the_sound"
  | "sort_the_word_families"
  | "read_a_story"
  | "sing_and_chant"
  | "put_the_story_in_order"
  | "build_the_sentences"
  | "made_good_choice"
  | "sort_healthy_choices";

export interface IAdminLessonHomeworkConfig {
  playSongFirst: boolean;
  playStory: boolean;
  activityTypes: TAdminLessonHomeworkActivityType[];
}

export interface IAdminLesson {
  id: string;
  title: string;
  level: string;
  unit: string;
  thumbnailUrl: string | null;
  createdAt: string;
  song: IAdminLessonSong | null;
  storyVideo: IAdminLessonStoryVideo | null;
  vocabs: IAdminLessonVocabItem[];
  wordFamilySet: IAdminLessonWordFamilySet | null;
  storySummary: IAdminLessonStorySummary | null;
  buildSentenceSet: IAdminLessonBuildSentenceSet | null;
  healthyChoices: IAdminLessonHealthyChoiceQuestion[];
  sortHealthyChoice: IAdminLessonSortHealthyChoice;
  homework: IAdminLessonHomeworkConfig | null;
}

export interface IAdminLessonFormValues {
  title: string;
  level: string;
  unit: string;
  thumbnailUrl: string;
}

export interface IAdminLessonListParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  unit?: string;
  from?: string;
  to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface IAdminLessonFilters {
  level: string;
  unit: string;
  from: string;
  to: string;
}
