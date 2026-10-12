import { StorageKeys } from "../../../constants";
import { ADMIN_PAGE_SIZE } from "../constants";
import AtomService from "../../../services/atom.service";
import type { IApiPagination } from "../../../models";
import type {
  IAdminLesson,
  IAdminLessonBuildSentenceItem,
  IAdminLessonBuildSentenceSet,
  IAdminLessonFormValues,
  IAdminLessonHealthyChoiceOption,
  IAdminLessonHealthyChoiceQuestion,
  IAdminLessonHomeworkConfig,
  IAdminLessonListParams,
  IAdminLessonSong,
  IAdminLessonSortHealthyBucket,
  IAdminLessonSortHealthyChoice,
  IAdminLessonSortHealthyItem,
  TAdminLessonHomeworkActivityType,
  TAdminLessonSortHealthyBucketKey,
  IAdminLessonStorySummary,
  IAdminLessonStoryVideo,
  IAdminLessonVocabItem,
  IAdminLessonWordFamily,
  IAdminLessonWordFamilySet,
} from "./types";
import {
  ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES,
  ADMIN_LESSON_SORT_KEYS,
  DEFAULT_SORT_HEALTHY_BUCKET_TITLES,
  MOCK_BUILD_SENTENCE_GENERATE_DELAY_MS,
  MOCK_BUILD_SENTENCE_TEMPLATES,
  MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES,
  MOCK_LESSON_SONG_AI_PROFILES,
  MOCK_LESSON_SONG_AUDIO_URL,
  MOCK_LESSON_STORY_SUMMARY_AI_PROFILES,
  MOCK_LESSON_WORD_FAMILY_AI_PROFILES,
  MOCK_SONG_GENERATE_DELAY_MS,
  MOCK_STORY_SUMMARY_GENERATE_DELAY_MS,
  MOCK_STORY_SUMMARY_SETS,
  MOCK_WORD_FAMILY_GENERATE_DELAY_MS,
  MOCK_WORD_FAMILY_PAIRS,
} from "./constants";
import { SORT_ORDERS } from "../../../hooks/useSort";

const buildPlaceholderSrt = (text: string): string => {
  const chunks = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lines =
    chunks.length > 0 ? chunks : [text.trim() || "Placeholder lyrics"];
  const msPerLine = 3000;
  return lines
    .map((line, index) => {
      const startMs = index * msPerLine;
      const endMs = startMs + msPerLine;
      const fmt = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const rem = ms % 1000;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(rem).padStart(3, "0")}`;
      };
      return `${index + 1}\n${fmt(startMs)} --> ${fmt(endMs)}\n${line}\n`;
    })
    .join("\n");
};

type TLegacyLesson = Omit<
  IAdminLesson,
  | "song"
  | "storyVideo"
  | "vocabs"
  | "wordFamilySet"
  | "storySummary"
  | "buildSentenceSet"
  | "healthyChoices"
  | "sortHealthyChoice"
  | "homework"
> & {
  song?: IAdminLessonSong | null;
  songs?: IAdminLessonSong[];
  storyVideo?: IAdminLessonStoryVideo | null;
  vocabs?: IAdminLessonVocabItem[];
  wordFamilySet?: IAdminLessonWordFamilySet | null;
  storySummary?: IAdminLessonStorySummary | null;
  buildSentenceSet?: IAdminLessonBuildSentenceSet | null;
  healthyChoices?: IAdminLessonHealthyChoiceQuestion[];
  sortHealthyChoice?: IAdminLessonSortHealthyChoice;
  homework?: IAdminLessonHomeworkConfig | null;
};

const HOMEWORK_ACTIVITY_TYPE_SET = new Set<string>(
  ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES,
);

const normalizeHomework = (
  raw?: IAdminLessonHomeworkConfig | null,
): IAdminLessonHomeworkConfig | null => {
  if (!raw || typeof raw !== "object") return null;

  const seen = new Set<TAdminLessonHomeworkActivityType>();
  const activityTypes: TAdminLessonHomeworkActivityType[] = [];
  if (Array.isArray(raw.activityTypes)) {
    for (const type of raw.activityTypes) {
      if (
        typeof type === "string" &&
        HOMEWORK_ACTIVITY_TYPE_SET.has(type) &&
        !seen.has(type as TAdminLessonHomeworkActivityType)
      ) {
        const activityType = type as TAdminLessonHomeworkActivityType;
        seen.add(activityType);
        activityTypes.push(activityType);
      }
    }
  }

  return {
    playSongFirst: Boolean(raw.playSongFirst),
    playStory: Boolean(raw.playStory),
    activityTypes,
  };
};

const emptySortHealthyBucket = (
  key: TAdminLessonSortHealthyBucketKey,
): IAdminLessonSortHealthyBucket => ({
  title: DEFAULT_SORT_HEALTHY_BUCKET_TITLES[key],
  items: [],
});

const emptySortHealthyChoice = (): IAdminLessonSortHealthyChoice => ({
  healthyFood: emptySortHealthyBucket("healthyFood"),
  junkFood: emptySortHealthyBucket("junkFood"),
});

const normalizeSortHealthyBucket = (
  key: TAdminLessonSortHealthyBucketKey,
  raw: unknown,
): IAdminLessonSortHealthyBucket => {
  if (Array.isArray(raw)) {
    return {
      title: DEFAULT_SORT_HEALTHY_BUCKET_TITLES[key],
      items: raw as IAdminLessonSortHealthyItem[],
    };
  }

  if (raw && typeof raw === "object") {
    const bucket = raw as Partial<IAdminLessonSortHealthyBucket>;
    const title =
      typeof bucket.title === "string" && bucket.title.trim()
        ? bucket.title.trim()
        : DEFAULT_SORT_HEALTHY_BUCKET_TITLES[key];
    return {
      title,
      items: Array.isArray(bucket.items) ? bucket.items : [],
    };
  }

  return emptySortHealthyBucket(key);
};

const normalizeSortHealthyChoice = (
  raw?: IAdminLessonSortHealthyChoice | Record<string, unknown>,
): IAdminLessonSortHealthyChoice => {
  if (!raw) return emptySortHealthyChoice();
  return {
    healthyFood: normalizeSortHealthyBucket("healthyFood", raw.healthyFood),
    junkFood: normalizeSortHealthyBucket("junkFood", raw.junkFood),
  };
};

const normalizeLesson = (raw: TLegacyLesson): IAdminLesson => {
  let song: IAdminLessonSong | null = null;
  if (raw.song !== undefined) {
    song = raw.song ?? null;
  } else if (Array.isArray(raw.songs)) {
    song = raw.songs[0] ?? null;
  }

  const { songs: _legacySongs, ...rest } = raw;

  return {
    ...rest,
    song,
    storyVideo: raw.storyVideo
      ? {
          ...raw.storyVideo,
          subtitleContent: raw.storyVideo.subtitleContent ?? null,
        }
      : null,
    vocabs: Array.isArray(raw.vocabs) ? raw.vocabs : [],
    wordFamilySet: raw.wordFamilySet ?? null,
    storySummary: raw.storySummary ?? null,
    buildSentenceSet: raw.buildSentenceSet ?? null,
    healthyChoices: Array.isArray(raw.healthyChoices)
      ? raw.healthyChoices
      : [],
    sortHealthyChoice: normalizeSortHealthyChoice(raw.sortHealthyChoice),
    homework: normalizeHomework(raw.homework),
  };
};

const SEED_LESSONS: IAdminLesson[] = [
  {
    id: "lesson-1",
    title: "Greetings",
    level: "Level 1",
    unit: "Unit 1",
    thumbnailUrl: "https://picsum.photos/seed/lesson1/160/120",
    createdAt: "2026-01-12T08:00:00.000Z",
    song: {
      id: "song-seed-1",
      lessonId: "lesson-1",
      text: "Hello\nGood morning",
      aiProfileId: "mock-profile-song-voice",
      aiProfileName: "Song Voice (mock)",
      audioUrl: MOCK_LESSON_SONG_AUDIO_URL,
      srtContent: buildPlaceholderSrt("Hello\nGood morning"),
      createdAt: "2026-01-12T09:00:00.000Z",
    },
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-2",
    title: "Family",
    level: "Level 1",
    unit: "Unit 2",
    thumbnailUrl: "https://picsum.photos/seed/lesson2/160/120",
    createdAt: "2026-02-03T10:30:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-3",
    title: "Shopping",
    level: "Level 2",
    unit: "Unit 1",
    thumbnailUrl: "https://picsum.photos/seed/lesson3/160/120",
    createdAt: "2026-03-18T14:15:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-4",
    title: "Travel",
    level: "Level 2",
    unit: "Unit 3",
    thumbnailUrl: null,
    createdAt: "2026-04-22T09:45:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-5",
    title: "Occupations",
    level: "Level 3",
    unit: "Unit 2",
    thumbnailUrl: "https://picsum.photos/seed/lesson5/160/120",
    createdAt: "2026-05-09T16:20:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-6",
    title: "Weather",
    level: "Level 3",
    unit: "Unit 4",
    thumbnailUrl: "https://picsum.photos/seed/lesson6/160/120",
    createdAt: "2026-06-14T11:00:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-7",
    title: "Health",
    level: "Level 4",
    unit: "Unit 1",
    thumbnailUrl: "https://picsum.photos/seed/lesson7/160/120",
    createdAt: "2026-07-01T07:30:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
  {
    id: "lesson-8",
    title: "Culture",
    level: "Level 4",
    unit: "Unit 5",
    thumbnailUrl: null,
    createdAt: "2026-08-20T13:10:00.000Z",
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  },
];

const persist = (lessons: IAdminLesson[]): void => {
  AtomService.set(StorageKeys.ADMIN_LESSONS, lessons);
};

const dayKey = (iso: string): string => {
  if (!iso) return "";
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const needsMigration = (lesson: TLegacyLesson): boolean => {
  if (Array.isArray(lesson.songs)) return true;
  if (lesson.song === undefined) return true;
  if (lesson.storyVideo === undefined) return true;
  if (!Array.isArray(lesson.vocabs)) return true;
  if (lesson.wordFamilySet === undefined) return true;
  if (lesson.storySummary === undefined) return true;
  if (lesson.buildSentenceSet === undefined) return true;
  if (!Array.isArray(lesson.healthyChoices)) return true;
  if (!lesson.sortHealthyChoice) return true;
  const { healthyFood, junkFood } = lesson.sortHealthyChoice as {
    healthyFood?: unknown;
    junkFood?: unknown;
  };
  const isBucketShape = (value: unknown): boolean =>
    Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Array.isArray((value as IAdminLessonSortHealthyBucket).items) &&
        typeof (value as IAdminLessonSortHealthyBucket).title === "string",
    );
  if (!isBucketShape(healthyFood) || !isBucketShape(junkFood)) {
    return true;
  }
  if (lesson.homework === undefined) return true;
  return false;
};

const ensureSeeded = (): IAdminLesson[] => {
  const existing = AtomService.get<TLegacyLesson[]>(StorageKeys.ADMIN_LESSONS);
  if (existing === undefined) {
    AtomService.set(StorageKeys.ADMIN_LESSONS, SEED_LESSONS);
    return [...SEED_LESSONS];
  }
  const normalized = existing.map((lesson) => normalizeLesson(lesson));
  if (existing.some(needsMigration)) {
    persist(normalized);
  }
  return normalized;
};

const createId = (): string =>
  `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createSongId = (): string =>
  `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createVocabId = (): string =>
  `vocab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createWordFamilyId = (): string =>
  `wf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createBuildSentenceId = (): string =>
  `bs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createHealthyChoiceId = (): string =>
  `hc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createHealthyChoiceOptionId = (): string =>
  `hco-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createSortHealthyItemId = (): string =>
  `shi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const buildPagination = (
  totalCount: number,
  page: number,
  limit: number,
): IApiPagination => {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit) || 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return {
    current_page: currentPage,
    total_pages: totalPages,
    total_count: totalCount,
    limit,
    next_page: currentPage < totalPages ? currentPage + 1 : null,
    prev_page: currentPage > 1 ? currentPage - 1 : null,
  };
};

export const listLessons = (
  params: IAdminLessonListParams = {},
): { lessons: IAdminLesson[]; pagination: IApiPagination } => {
  const {
    page = 1,
    limit = ADMIN_PAGE_SIZE,
    search = "",
    level = "",
    unit = "",
    from = "",
    to = "",
    sort_by = ADMIN_LESSON_SORT_KEYS.CREATED_AT,
    sort_order = SORT_ORDERS.DESC,
  } = params;

  let items = ensureSeeded();

  const query = search.trim().toLowerCase();
  if (query) {
    items = items.filter((lesson) =>
      lesson.title.toLowerCase().includes(query),
    );
  }

  if (level) {
    items = items.filter((lesson) => lesson.level === level);
  }

  if (unit) {
    items = items.filter((lesson) => lesson.unit === unit);
  }

  const fromDay = dayKey(from);
  const toDay = dayKey(to);
  if (fromDay) {
    items = items.filter((lesson) => dayKey(lesson.createdAt) >= fromDay);
  }
  if (toDay) {
    items = items.filter((lesson) => dayKey(lesson.createdAt) <= toDay);
  }

  const sortKey =
    sort_by === ADMIN_LESSON_SORT_KEYS.TITLE ||
    sort_by === ADMIN_LESSON_SORT_KEYS.LEVEL ||
    sort_by === ADMIN_LESSON_SORT_KEYS.UNIT ||
    sort_by === ADMIN_LESSON_SORT_KEYS.CREATED_AT
      ? sort_by
      : ADMIN_LESSON_SORT_KEYS.CREATED_AT;

  items = [...items].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      sensitivity: "base",
      numeric: true,
    });
    return sort_order === SORT_ORDERS.ASC ? cmp : -cmp;
  });

  const pagination = buildPagination(items.length, page, limit);
  const start = (pagination.current_page - 1) * limit;
  const lessons = items.slice(start, start + limit);

  return { lessons, pagination };
};

export const getLesson = (id: string): IAdminLesson | null => {
  return ensureSeeded().find((lesson) => lesson.id === id) ?? null;
};

export const getLessonHomework = (
  lessonId: string,
): IAdminLessonHomeworkConfig | null => {
  return getLesson(lessonId)?.homework ?? null;
};

export const saveLessonHomework = (
  lessonId: string,
  config: IAdminLessonHomeworkConfig,
): IAdminLessonHomeworkConfig | null => {
  const normalized = normalizeHomework(config);
  if (!normalized) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const next = [...lessons];
  next[index] = {
    ...lessons[index],
    homework: normalized,
  };
  persist(next);
  return normalized;
};

export const createLesson = (
  values: IAdminLessonFormValues,
): IAdminLesson => {
  const lessons = ensureSeeded();
  const lesson: IAdminLesson = {
    id: createId(),
    title: values.title.trim(),
    level: values.level,
    unit: values.unit,
    thumbnailUrl: values.thumbnailUrl.trim() || null,
    createdAt: new Date().toISOString(),
    song: null,
    storyVideo: null,
    vocabs: [],
    wordFamilySet: null,
    storySummary: null,
    buildSentenceSet: null,
    healthyChoices: [],
    sortHealthyChoice: emptySortHealthyChoice(),
    homework: null,
  };
  persist([lesson, ...lessons]);
  return lesson;
};

export const updateLesson = (
  id: string,
  values: IAdminLessonFormValues,
): IAdminLesson | null => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === id);
  if (index < 0) return null;

  const updated: IAdminLesson = {
    ...lessons[index],
    title: values.title.trim(),
    level: values.level,
    unit: values.unit,
    thumbnailUrl: values.thumbnailUrl.trim() || null,
  };
  const next = [...lessons];
  next[index] = updated;
  persist(next);
  return updated;
};

export const deleteLesson = (id: string): boolean => {
  const lessons = ensureSeeded();
  const next = lessons.filter((lesson) => lesson.id !== id);
  if (next.length === lessons.length) return false;
  persist(next);
  return true;
};

export async function generateMockLessonSong(
  lessonId: string,
  input: { text: string; aiProfileId: string },
): Promise<{ success: boolean; song?: IAdminLessonSong; error?: string }> {
  const text = input.text.trim();
  if (!text) {
    return { success: false, error: "text_required" };
  }

  const profile = MOCK_LESSON_SONG_AI_PROFILES.find(
    (item) => item.id === input.aiProfileId,
  );
  if (!profile) {
    return { success: false, error: "profile_required" };
  }

  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_SONG_GENERATE_DELAY_MS),
  );

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) {
    return { success: false, error: "lesson_not_found" };
  }

  const song: IAdminLessonSong = {
    id: createSongId(),
    lessonId,
    text,
    aiProfileId: profile.id,
    aiProfileName: profile.name,
    audioUrl: MOCK_LESSON_SONG_AUDIO_URL,
    srtContent: buildPlaceholderSrt(text),
    createdAt: new Date().toISOString(),
  };

  const next = [...lessons];
  next[index] = { ...lessons[index], song };
  persist(next);

  return { success: true, song };
}

export const clearLessonSong = (lessonId: string): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  if (!lessons[index].song) return false;

  const next = [...lessons];
  next[index] = { ...lessons[index], song: null };
  persist(next);
  return true;
};

export const setLessonStoryVideo = (
  lessonId: string,
  storyVideo: IAdminLessonStoryVideo,
): IAdminLesson | null => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const updated: IAdminLesson = { ...lessons[index], storyVideo };
  const next = [...lessons];
  next[index] = updated;
  persist(next);
  return updated;
};

export const clearLessonStoryVideo = (lessonId: string): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  if (!lessons[index].storyVideo) return false;

  const next = [...lessons];
  next[index] = { ...lessons[index], storyVideo: null };
  persist(next);
  return true;
};

export type TLessonVocabInput = {
  vocab: string;
  vowelSound: string;
  imageAssetId: string;
  imageUrl: string;
};

export const addLessonVocab = (
  lessonId: string,
  input: TLessonVocabInput,
): IAdminLessonVocabItem | null => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const item: IAdminLessonVocabItem = {
    id: createVocabId(),
    vocab: input.vocab.trim(),
    vowelSound: input.vowelSound.trim(),
    imageAssetId: input.imageAssetId,
    imageUrl: input.imageUrl,
    createdAt: new Date().toISOString(),
  };

  const lesson = lessons[index];
  const next = [...lessons];
  next[index] = { ...lesson, vocabs: [...lesson.vocabs, item] };
  persist(next);
  return item;
};

export const updateLessonVocab = (
  lessonId: string,
  vocabId: string,
  input: TLessonVocabInput,
): IAdminLessonVocabItem | null => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const lesson = lessons[index];
  const vocabIndex = lesson.vocabs.findIndex((item) => item.id === vocabId);
  if (vocabIndex < 0) return null;

  const updated: IAdminLessonVocabItem = {
    ...lesson.vocabs[vocabIndex],
    vocab: input.vocab.trim(),
    vowelSound: input.vowelSound.trim(),
    imageAssetId: input.imageAssetId,
    imageUrl: input.imageUrl,
  };

  const vocabs = [...lesson.vocabs];
  vocabs[vocabIndex] = updated;
  const next = [...lessons];
  next[index] = { ...lesson, vocabs };
  persist(next);
  return updated;
};

export const deleteLessonVocab = (
  lessonId: string,
  vocabId: string,
): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;

  const lesson = lessons[index];
  const vocabs = lesson.vocabs.filter((item) => item.id !== vocabId);
  if (vocabs.length === lesson.vocabs.length) return false;

  const next = [...lessons];
  next[index] = { ...lesson, vocabs };
  persist(next);
  return true;
};

export async function generateMockLessonWordFamilies(
  lessonId: string,
  input: { aiProfileId: string },
): Promise<{
  success: boolean;
  wordFamilySet?: IAdminLessonWordFamilySet;
  error?: string;
}> {
  const profile = MOCK_LESSON_WORD_FAMILY_AI_PROFILES.find(
    (item) => item.id === input.aiProfileId,
  );
  if (!profile) {
    return { success: false, error: "profile_required" };
  }

  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_WORD_FAMILY_GENERATE_DELAY_MS),
  );

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) {
    return { success: false, error: "lesson_not_found" };
  }

  const pairIndex =
    lessons[index].wordFamilySet?.families[0]?.title.includes("-et") ? 1 : 0;
  const pair = MOCK_WORD_FAMILY_PAIRS[pairIndex];

  const families: IAdminLessonWordFamily[] = pair.map((family) => ({
    id: createWordFamilyId(),
    title: family.title,
    words: [...family.words],
  }));

  const wordFamilySet: IAdminLessonWordFamilySet = {
    aiProfileId: profile.id,
    aiProfileName: profile.name,
    createdAt: new Date().toISOString(),
    families,
  };

  const next = [...lessons];
  next[index] = { ...lessons[index], wordFamilySet };
  persist(next);

  return { success: true, wordFamilySet };
}

export const updateLessonWordFamily = (
  lessonId: string,
  familyId: string,
  input: { title: string; words: string[] },
): IAdminLessonWordFamily | null => {
  const title = input.title.trim();
  const words = input.words.map((word) => word.trim()).filter(Boolean);
  if (!title || words.length === 0) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const set = lessons[index].wordFamilySet;
  if (!set) return null;

  const familyIndex = set.families.findIndex((family) => family.id === familyId);
  if (familyIndex < 0) return null;

  const updated: IAdminLessonWordFamily = {
    ...set.families[familyIndex],
    title,
    words,
  };

  const families = [...set.families];
  families[familyIndex] = updated;

  const next = [...lessons];
  next[index] = {
    ...lessons[index],
    wordFamilySet: { ...set, families },
  };
  persist(next);
  return updated;
};

export const clearLessonWordFamilySet = (lessonId: string): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  if (!lessons[index].wordFamilySet) return false;

  const next = [...lessons];
  next[index] = { ...lessons[index], wordFamilySet: null };
  persist(next);
  return true;
};

export async function generateMockLessonStorySummary(
  lessonId: string,
  input: { aiProfileId: string },
): Promise<{
  success: boolean;
  storySummary?: IAdminLessonStorySummary;
  error?: string;
}> {
  const profile = MOCK_LESSON_STORY_SUMMARY_AI_PROFILES.find(
    (item) => item.id === input.aiProfileId,
  );
  if (!profile) {
    return { success: false, error: "profile_required" };
  }

  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_STORY_SUMMARY_GENERATE_DELAY_MS),
  );

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) {
    return { success: false, error: "lesson_not_found" };
  }

  const setIndex = lessons[index].storySummary?.sentences[0]?.includes(
    "friends meet",
  )
    ? 1
    : 0;
  const sentences = [...MOCK_STORY_SUMMARY_SETS[setIndex]];

  const storySummary: IAdminLessonStorySummary = {
    aiProfileId: profile.id,
    aiProfileName: profile.name,
    createdAt: new Date().toISOString(),
    sentences,
  };

  const next = [...lessons];
  next[index] = { ...lessons[index], storySummary };
  persist(next);

  return { success: true, storySummary };
}

export const updateLessonStorySummary = (
  lessonId: string,
  input: { sentences: string[] },
): IAdminLessonStorySummary | null => {
  const sentences = input.sentences.map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const current = lessons[index].storySummary;
  if (!current) return null;

  const storySummary: IAdminLessonStorySummary = {
    ...current,
    sentences,
  };

  const next = [...lessons];
  next[index] = { ...lessons[index], storySummary };
  persist(next);
  return storySummary;
};

export const clearLessonStorySummary = (lessonId: string): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  if (!lessons[index].storySummary) return false;

  const next = [...lessons];
  next[index] = { ...lessons[index], storySummary: null };
  persist(next);
  return true;
};

export async function generateMockLessonBuildSentences(
  lessonId: string,
  input: { aiProfileId: string },
): Promise<{
  success: boolean;
  buildSentenceSet?: IAdminLessonBuildSentenceSet;
  error?: string;
}> {
  const profile = MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES.find(
    (item) => item.id === input.aiProfileId,
  );
  if (!profile) {
    return { success: false, error: "profile_required" };
  }

  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_BUILD_SENTENCE_GENERATE_DELAY_MS),
  );

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) {
    return { success: false, error: "lesson_not_found" };
  }

  const lesson = lessons[index];
  if (!lesson.vocabs.length) {
    return { success: false, error: "vocabs_required" };
  }

  // Soft context: subtitleContent available for future real SRT matching.
  void lesson.storyVideo?.subtitleContent;

  const templateIndex = lesson.buildSentenceSet?.items[0]?.sentence.includes(
    "talk about",
  )
    ? 0
    : 1;
  const template =
    MOCK_BUILD_SENTENCE_TEMPLATES[
      templateIndex % MOCK_BUILD_SENTENCE_TEMPLATES.length
    ];

  const items: IAdminLessonBuildSentenceItem[] = lesson.vocabs.map((vocab) => ({
    id: createBuildSentenceId(),
    vocabId: vocab.id,
    vocab: vocab.vocab,
    sentence: template.replace(/\{\{vocab\}\}/g, vocab.vocab),
  }));

  const buildSentenceSet: IAdminLessonBuildSentenceSet = {
    aiProfileId: profile.id,
    aiProfileName: profile.name,
    createdAt: new Date().toISOString(),
    items,
  };

  const next = [...lessons];
  next[index] = { ...lesson, buildSentenceSet };
  persist(next);

  return { success: true, buildSentenceSet };
}

export const updateLessonBuildSentence = (
  lessonId: string,
  itemId: string,
  input: { sentence: string },
): IAdminLessonBuildSentenceItem | null => {
  const sentence = input.sentence.trim();
  if (!sentence) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const set = lessons[index].buildSentenceSet;
  if (!set) return null;

  const itemIndex = set.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) return null;

  const updated: IAdminLessonBuildSentenceItem = {
    ...set.items[itemIndex],
    sentence,
  };

  const items = [...set.items];
  items[itemIndex] = updated;

  const next = [...lessons];
  next[index] = {
    ...lessons[index],
    buildSentenceSet: { ...set, items },
  };
  persist(next);
  return updated;
};

export const clearLessonBuildSentenceSet = (lessonId: string): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  if (!lessons[index].buildSentenceSet) return false;

  const next = [...lessons];
  next[index] = { ...lessons[index], buildSentenceSet: null };
  persist(next);
  return true;
};

export type TLessonHealthyChoiceInput = {
  title: string;
  options: Array<{
    id?: string;
    text: string;
    imageAssetId: string;
    imageUrl: string;
  }>;
  correctOptionIds: string[];
};

const validateHealthyChoiceInput = (
  input: TLessonHealthyChoiceInput,
): {
  ok: boolean;
  title?: string;
  options?: IAdminLessonHealthyChoiceOption[];
  correctOptionIds?: string[];
  error?: string;
} => {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title_required" };

  if (!Array.isArray(input.options) || input.options.length < 2) {
    return { ok: false, error: "options_min" };
  }

  const options: IAdminLessonHealthyChoiceOption[] = [];
  for (const option of input.options) {
    const text = option.text.trim();
    if (!text || !option.imageAssetId || !option.imageUrl) {
      return { ok: false, error: "option_invalid" };
    }
    options.push({
      id: option.id?.trim() || createHealthyChoiceOptionId(),
      text,
      imageAssetId: option.imageAssetId,
      imageUrl: option.imageUrl,
    });
  }

  const optionIds = new Set(options.map((option) => option.id));
  const correctOptionIds = Array.from(
    new Set(input.correctOptionIds.filter((id) => optionIds.has(id))),
  );
  if (correctOptionIds.length === 0) {
    return { ok: false, error: "correct_required" };
  }

  return { ok: true, title, options, correctOptionIds };
};

export const addLessonHealthyChoice = (
  lessonId: string,
  input: TLessonHealthyChoiceInput,
): IAdminLessonHealthyChoiceQuestion | null => {
  const validated = validateHealthyChoiceInput(input);
  if (!validated.ok || !validated.title || !validated.options || !validated.correctOptionIds) {
    return null;
  }

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const item: IAdminLessonHealthyChoiceQuestion = {
    id: createHealthyChoiceId(),
    title: validated.title,
    options: validated.options,
    correctOptionIds: validated.correctOptionIds,
    createdAt: new Date().toISOString(),
  };

  const lesson = lessons[index];
  const next = [...lessons];
  next[index] = {
    ...lesson,
    healthyChoices: [...lesson.healthyChoices, item],
  };
  persist(next);
  return item;
};

export const updateLessonHealthyChoice = (
  lessonId: string,
  questionId: string,
  input: TLessonHealthyChoiceInput,
): IAdminLessonHealthyChoiceQuestion | null => {
  const validated = validateHealthyChoiceInput(input);
  if (!validated.ok || !validated.title || !validated.options || !validated.correctOptionIds) {
    return null;
  }

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const lesson = lessons[index];
  const questionIndex = lesson.healthyChoices.findIndex(
    (item) => item.id === questionId,
  );
  if (questionIndex < 0) return null;

  const updated: IAdminLessonHealthyChoiceQuestion = {
    ...lesson.healthyChoices[questionIndex],
    title: validated.title,
    options: validated.options,
    correctOptionIds: validated.correctOptionIds,
  };

  const healthyChoices = [...lesson.healthyChoices];
  healthyChoices[questionIndex] = updated;
  const next = [...lessons];
  next[index] = { ...lesson, healthyChoices };
  persist(next);
  return updated;
};

export const deleteLessonHealthyChoice = (
  lessonId: string,
  questionId: string,
): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;

  const lesson = lessons[index];
  const healthyChoices = lesson.healthyChoices.filter(
    (item) => item.id !== questionId,
  );
  if (healthyChoices.length === lesson.healthyChoices.length) return false;

  const next = [...lessons];
  next[index] = { ...lesson, healthyChoices };
  persist(next);
  return true;
};

type TLessonSortHealthyItemInput = {
  text: string;
  imageAssetId: string;
  imageUrl: string;
};

const validateSortHealthyItemInput = (
  input: TLessonSortHealthyItemInput,
):
  | { ok: true; text: string; imageAssetId: string; imageUrl: string }
  | { ok: false } => {
  const text = input.text.trim();
  const imageAssetId = input.imageAssetId.trim();
  const imageUrl = input.imageUrl.trim();
  if (!text || !imageAssetId || !imageUrl) return { ok: false };
  return { ok: true, text, imageAssetId, imageUrl };
};

export const updateLessonSortHealthyBucketTitle = (
  lessonId: string,
  bucketKey: TAdminLessonSortHealthyBucketKey,
  title: string,
): IAdminLessonSortHealthyBucket | null => {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const lesson = lessons[index];
  const updatedBucket: IAdminLessonSortHealthyBucket = {
    ...lesson.sortHealthyChoice[bucketKey],
    title: trimmed,
  };

  const next = [...lessons];
  next[index] = {
    ...lesson,
    sortHealthyChoice: {
      ...lesson.sortHealthyChoice,
      [bucketKey]: updatedBucket,
    },
  };
  persist(next);
  return updatedBucket;
};

export const addLessonSortHealthyItem = (
  lessonId: string,
  bucketKey: TAdminLessonSortHealthyBucketKey,
  input: TLessonSortHealthyItemInput,
): IAdminLessonSortHealthyItem | null => {
  const validated = validateSortHealthyItemInput(input);
  if (!validated.ok) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const item: IAdminLessonSortHealthyItem = {
    id: createSortHealthyItemId(),
    text: validated.text,
    imageAssetId: validated.imageAssetId,
    imageUrl: validated.imageUrl,
  };

  const lesson = lessons[index];
  const bucket = lesson.sortHealthyChoice[bucketKey];
  const next = [...lessons];
  next[index] = {
    ...lesson,
    sortHealthyChoice: {
      ...lesson.sortHealthyChoice,
      [bucketKey]: {
        ...bucket,
        items: [...bucket.items, item],
      },
    },
  };
  persist(next);
  return item;
};

export const updateLessonSortHealthyItem = (
  lessonId: string,
  bucketKey: TAdminLessonSortHealthyBucketKey,
  itemId: string,
  input: TLessonSortHealthyItemInput,
): IAdminLessonSortHealthyItem | null => {
  const validated = validateSortHealthyItemInput(input);
  if (!validated.ok) return null;

  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;

  const lesson = lessons[index];
  const bucket = lesson.sortHealthyChoice[bucketKey];
  const itemIndex = bucket.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) return null;

  const updated: IAdminLessonSortHealthyItem = {
    ...bucket.items[itemIndex],
    text: validated.text,
    imageAssetId: validated.imageAssetId,
    imageUrl: validated.imageUrl,
  };

  const nextItems = [...bucket.items];
  nextItems[itemIndex] = updated;

  const next = [...lessons];
  next[index] = {
    ...lesson,
    sortHealthyChoice: {
      ...lesson.sortHealthyChoice,
      [bucketKey]: {
        ...bucket,
        items: nextItems,
      },
    },
  };
  persist(next);
  return updated;
};

export const deleteLessonSortHealthyItem = (
  lessonId: string,
  bucketKey: TAdminLessonSortHealthyBucketKey,
  itemId: string,
): boolean => {
  const lessons = ensureSeeded();
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;

  const lesson = lessons[index];
  const bucket = lesson.sortHealthyChoice[bucketKey];
  const nextItems = bucket.items.filter((item) => item.id !== itemId);
  if (nextItems.length === bucket.items.length) return false;

  const next = [...lessons];
  next[index] = {
    ...lesson,
    sortHealthyChoice: {
      ...lesson.sortHealthyChoice,
      [bucketKey]: {
        ...bucket,
        items: nextItems,
      },
    },
  };
  persist(next);
  return true;
};
