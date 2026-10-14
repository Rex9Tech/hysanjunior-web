# Web Lesson CMS Bind Plan

Core API is ready. Web UI lives under `src/modules/admin/lesson/` (mock store today). Replace mock with `/v1/admin/lessons`. AI song generation is out of scope.

**Hide / defer (not in Core):** `homework`, `storySummary`, `thumbnailUrl`, AI song lyrics/profile.

**Reshape to Core:** MCQ → `questions[]`; sort healthy → dynamic `sort_health_choices[]` (not fixed healthyFood/junkFood).

---

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/v1/admin/lessons` | List + filters + pagy |
| POST | `/v1/admin/lessons` | Create (JSON or multipart) |
| GET | `/v1/admin/lessons/:id` | Detail |
| PATCH/PUT | `/v1/admin/lessons/:id` | Update (JSON or multipart) |
| DELETE | `/v1/admin/lessons/:id` | Soft discard |
| POST | `/v1/admin/lessons/:id/undiscard` | Restore |
| POST | `/v1/admin/lessons/:id/create_word_families` | AI preview queue → 202 |
| POST | `/v1/admin/lessons/:id/create_story_order` | AI preview queue → 202 |
| POST | `/v1/admin/lessons/:id/create_build_the_sentences` | AI preview queue → 202 |

**Query (index):** `page`, `limit`, `search`, `status`, `level`, `unit`, `sort_by`, `sort_order`, `discarded=true`

**Multipart top-level files (not under `lesson[]`):** `audio`, `srt`, `video`, `video_srt`, `thumbnail`

**Nested sync rule:** key omitted = leave unchanged; `[]` = clear; array order = `position`; omitted existing ids destroyed.

**Publish gate (`status: published`):** song+SRT, story+SRT, ≥1 vocab with image, ≥1 word family with words, non-empty `story_order`, one `{vocab,sentence}` per vocabulary, ≥1 ready MCQ, ≥1 ready sort-health group.

---

## Envelope

All responses use the standard Core envelope:

```ts
interface IApiEnvelope<T> {
  status: {
    success: boolean;
    message: string;
    error?: string; // 422 detail (validation / attach / sync)
  };
  data?: T;
  meta?: {
    pagination?: {
      current_page: number;
      total_pages: number;
      total_count: number;
      limit: number;
      next_page: number | null;
      prev_page: number | null;
    };
  };
}
```

JSON:API resource shape before flatten:

```ts
interface IJsonApiResource<T> {
  id: string;
  type: string;
  attributes: T;
}
```

After `parseRecord`, nested collections (`vocabularies`, `word_families`, `questions`, `sort_health_choices`, `options`, `items`, `song`, `story`, `image`) may still be raw `{ id, type, attributes }` — flatten recursively.

---

## TypeScript types (Core-aligned)

Copy into `src/modules/admin/lesson/types.ts` (or split as needed).

```ts
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

/** Flattened asset on lesson (song / story / vocab image / option image). */
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
  items: IAdminLessonVocabulary[]; // vocab rows with sort_health_choice_id set
  created_at: string;
  updated_at: string;
}

export interface IAdminLessonBuildSentencePair {
  vocab: string;
  sentence: string;
}

/** Full lesson after parse + nested flatten. */
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

/** Create / update payload (JSON body under `lesson`). */
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
  // image: File via multipart only
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

/** Multipart companion files (top-level FormData keys). */
export interface IAdminLessonMediaFiles {
  audio?: File;
  srt?: File;
  video?: File;
  video_srt?: File;
  thumbnail?: File;
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

/** 202 AI queue response `data`. */
export interface IAdminLessonAiQueueResult {
  lesson_id: string;
  operation_id: string;
}
```

---

## Response examples

### GET / POST / PATCH — single lesson (`data`)

```json
{
  "status": { "success": true, "message": "..." },
  "data": {
    "id": "uuid",
    "type": "lesson",
    "attributes": {
      "id": "uuid",
      "title": "Greetings",
      "level": 1,
      "unit": "Unit 1",
      "status": "draft",
      "story_order": ["First we go to school.", "And I sit down."],
      "build_the_sentences": [
        { "vocab": "cat", "sentence": "I see the cat." }
      ],
      "song_asset_id": "uuid-or-null",
      "song": { "id": "...", "type": "asset", "attributes": { /* IAsset */ } },
      "story_asset_id": "uuid-or-null",
      "story": { "id": "...", "type": "asset", "attributes": { /* IAsset + children.subtitles */ } },
      "vocabularies": [
        {
          "id": "...",
          "type": "vocabulary",
          "attributes": {
            "id": "...",
            "vocab": "cat",
            "vowel_symbol": null,
            "position": 0,
            "image_asset_id": "...",
            "image": { "id": "...", "type": "asset", "attributes": {} },
            "created_at": "...",
            "updated_at": "..."
          }
        }
      ],
      "word_families": [
        {
          "id": "...",
          "type": "word_family",
          "attributes": {
            "pattern": "..et",
            "words": ["net", "set", "pet"],
            "position": 0
          }
        }
      ],
      "questions": [
        {
          "id": "...",
          "type": "question",
          "attributes": {
            "kind": "multiple_choice",
            "title": "Which animal?",
            "position": 0,
            "options": [
              {
                "id": "...",
                "type": "question_option",
                "attributes": {
                  "text": "Cat",
                  "correct": true,
                  "position": 0,
                  "image_asset_id": null,
                  "image": null
                }
              }
            ]
          }
        }
      ],
      "sort_health_choices": [
        {
          "id": "...",
          "type": "sort_health_choice",
          "attributes": {
            "label": "Fruits",
            "position": 0,
            "items": [
              {
                "id": "...",
                "type": "vocabulary",
                "attributes": {
                  "vocab": "apple",
                  "vowel_symbol": null,
                  "position": 0,
                  "image_asset_id": null,
                  "image": null
                }
              }
            ]
          }
        }
      ],
      "discarded_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

### GET list — `data[]` + `meta.pagination`

Same resource items as above (may be lighter includes). Use `parsePagyList`.

### DELETE discard / POST undiscard

- Discard: `data` often null; `status.success`
- Undiscard: returns lesson resource like show

### AI queue — 202

```json
{
  "status": { "success": true, "message": "..." },
  "data": {
    "lesson_id": "uuid",
    "operation_id": "lesson_word_families:uuid:uuid"
  }
}
```

### 422 failure

```json
{
  "status": {
    "success": false,
    "message": "...",
    "error": "A lesson needs at least one ready sort-health-choice group before it can be published."
  }
}
```

---

## Socket notifications (AI preview — not auto-saved)

Subscribe `NotificationChannel`. Filter `event.type === "notification"` and `event.data.type`:

| `data.type` | Payload extras |
|-------------|----------------|
| `lesson_word_families_generated` | `lesson_id`, `run_id`, `word_families: [{ pattern, words }]` |
| `lesson_word_families_failed` | `lesson_id`, `run_id`, `error` |
| `lesson_story_order_generated` | `lesson_id`, `run_id`, `story_order: string[]` |
| `lesson_story_order_failed` | `lesson_id`, `run_id`, `error` |
| `lesson_build_the_sentences_generated` | `lesson_id`, `run_id`, `build_the_sentences: [{ vocab, sentence }]` |
| `lesson_build_the_sentences_failed` | `lesson_id`, `run_id`, `error` |

```ts
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
```

On Accept → PATCH nested fields (`word_families` / `story_order` / `build_the_sentences`). Do not rely on Core auto-save.

Add types to `NOTIFICATION_SOCKET_TYPES` + toast success/error lists in `socket.helpers.ts`.

---

## AppRoutes (server)

```ts
LESSONS: AppRoutes.adminApi("/lessons"),
LESSON_DETAIL: AppRoutes.adminApi("/lessons/:id"),
LESSON_UNDISCARD: AppRoutes.adminApi("/lessons/:id/undiscard"),
LESSON_CREATE_WORD_FAMILIES: AppRoutes.adminApi("/lessons/:id/create_word_families"),
LESSON_CREATE_STORY_ORDER: AppRoutes.adminApi("/lessons/:id/create_story_order"),
LESSON_CREATE_BUILD_THE_SENTENCES: AppRoutes.adminApi(
  "/lessons/:id/create_build_the_sentences",
),
```

Client routes already exist: `LESSONS`, `LESSON_CREATE`, `LESSON_EDIT`.

---

## Implementation checklist

1. **API client** — `lesson.service.ts` + `lesson.controller.ts` (product pattern); FormData when media files present; recursive flatten nested JSON:API.
2. **Types** — replace mock types with types above; delete `lesson.mock.store.ts`.
3. **List / create / edit / discard** — wire pages; drop `adminOnly` on nav/routes; use IAM `lessons`; status draft/publish; show `status.error` on 422.
4. **Sections** — song/story pick-or-upload; vocab / word families / story_order / build_the_sentences / questions / sort_health_choices full-list sync.
5. **AI** — POST create_* → listen socket → preview → Accept PATCH.
6. **Cleanup** — remove homework / story summary / AI song UI; i18n status + AI pending/accept; README/ECOSYSTEM if needed.

---

## Out of scope

- AI-generated song (lyrics → audio + SRT)
- Homework / story summary / lesson thumbnail fields
- Mobile lesson player
