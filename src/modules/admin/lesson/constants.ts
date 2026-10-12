export const ADMIN_LESSON_SORT_KEYS = {
  TITLE: "title",
  LEVEL: "level",
  UNIT: "unit",
  CREATED_AT: "createdAt",
} as const;

export const ADMIN_LESSON_TABLE_KEYS = {
  THUMBNAIL: "thumbnail",
  TITLE: "title",
  UNIT: "unit",
  LEVEL: "level",
  CREATED_AT: "createdAt",
  ACTIONS: "actions",
} as const;

export const ADMIN_LESSON_LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
] as const;

export const ADMIN_LESSON_UNITS = [
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
] as const;

export const DEFAULT_SORT_HEALTHY_BUCKET_TITLES = {
  healthyFood: "Healthy Food",
  junkFood: "Junk Food",
} as const;

export const EMPTY_SORT_HEALTHY_CHOICE = {
  healthyFood: {
    title: DEFAULT_SORT_HEALTHY_BUCKET_TITLES.healthyFood,
    items: [],
  },
  junkFood: {
    title: DEFAULT_SORT_HEALTHY_BUCKET_TITLES.junkFood,
    items: [],
  },
} as const;

export const ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES = [
  "listen_and_tap",
  "speak_and_record",
  "trace_and_write",
  "blend_the_sound",
  "sort_the_word_families",
  "read_a_story",
  "sing_and_chant",
  "put_the_story_in_order",
  "build_the_sentences",
  "made_good_choice",
  "sort_healthy_choices",
] as const;

export const ADMIN_LESSON_HOMEWORK_ACTIVITY_LABELS: Record<
  (typeof ADMIN_LESSON_HOMEWORK_ACTIVITY_TYPES)[number],
  string
> = {
  listen_and_tap: "Listen And Tap",
  speak_and_record: "Speak and Record",
  trace_and_write: "Trace and Write",
  blend_the_sound: "Blend the sound",
  sort_the_word_families: "Sort the word families",
  read_a_story: "Read a Story",
  sing_and_chant: "Sing and chant",
  put_the_story_in_order: "Put the story in order",
  build_the_sentences: "Build the sentences",
  made_good_choice: "Made good choice",
  sort_healthy_choices: "Sort Healthy Choices",
};

/** Placeholder AI profiles until admin AI + song generate APIs exist. */
export const MOCK_LESSON_SONG_AI_PROFILES = [
  { id: "mock-profile-song-voice", name: "Song Voice (mock)" },
  { id: "mock-profile-kids-voice", name: "Kids Voice (mock)" },
  { id: "mock-profile-slow-learner", name: "Slow Learner (mock)" },
] as const;

/** Public sample audio — replaced by real asset URL when API exists. */
export const MOCK_LESSON_SONG_AUDIO_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const MOCK_SONG_GENERATE_DELAY_MS = 1200;

/** Placeholder AI profiles until word-family generate API exists. */
export const MOCK_LESSON_WORD_FAMILY_AI_PROFILES = [
  { id: "mock-profile-literacy", name: "Literacy Coach (mock)" },
  { id: "mock-profile-phonics", name: "Phonics Helper (mock)" },
  { id: "mock-profile-early-reader", name: "Early Reader (mock)" },
] as const;

export const MOCK_WORD_FAMILY_GENERATE_DELAY_MS = 1200;

/** Alternating mock pairs so regenerate feels different. */
export const MOCK_WORD_FAMILY_PAIRS = [
  [
    {
      title: "-et Word Family",
      words: [
        "Bet",
        "Get",
        "Jet",
        "Let",
        "Met",
        "Net",
        "Pet",
        "Set",
        "Wet",
      ],
    },
    {
      title: "-ed Word Family",
      words: ["Bed", "Fed", "Led", "Red", "Wed", "Bled", "Fled", "Shed"],
    },
  ],
  [
    {
      title: "-at Word Family",
      words: ["Bat", "Cat", "Fat", "Hat", "Mat", "Pat", "Rat", "Sat"],
    },
    {
      title: "-an Word Family",
      words: ["Ban", "Can", "Fan", "Man", "Pan", "Ran", "Tan", "Van"],
    },
  ],
] as const;

/** Placeholder AI profiles until story-summary generate API exists. */
export const MOCK_LESSON_STORY_SUMMARY_AI_PROFILES = [
  { id: "mock-profile-story-teller", name: "Story Teller (mock)" },
  { id: "mock-profile-simple-summary", name: "Simple Summary (mock)" },
  { id: "mock-profile-kids-summary", name: "Kids Summary (mock)" },
] as const;

export const MOCK_STORY_SUMMARY_GENERATE_DELAY_MS = 1200;

/** Alternating mock sentence sets so regenerate feels different. */
export const MOCK_STORY_SUMMARY_SETS = [
  [
    "First, the friends meet in the park.",
    "Then they look for a lost ball.",
    "Next they ask a kind neighbor for help.",
    "Finally they find the ball and cheer.",
  ],
  [
    "First, a child wakes up and opens the window.",
    "Then birds sing and the sun feels warm.",
    "Next the child packs a bag for school.",
    "Finally the child waves goodbye and starts the day.",
  ],
] as const;

/** Placeholder AI profiles until build-sentence generate API exists. */
export const MOCK_LESSON_BUILD_SENTENCE_AI_PROFILES = [
  { id: "mock-profile-sentence-builder", name: "Sentence Builder (mock)" },
  { id: "mock-profile-srt-matcher", name: "SRT Matcher (mock)" },
  { id: "mock-profile-vocab-sentence", name: "Vocab Sentence (mock)" },
] as const;

export const MOCK_BUILD_SENTENCE_GENERATE_DELAY_MS = 1200;

/** Alternating mock templates; `{{vocab}}` is replaced per vocab. */
export const MOCK_BUILD_SENTENCE_TEMPLATES = [
  "I see {{vocab}} in the story.",
  "We talk about {{vocab}} in this lesson.",
] as const;
