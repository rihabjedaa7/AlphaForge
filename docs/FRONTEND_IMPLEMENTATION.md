# Frontend Implementation

## Overview

The frontend is a single-page React + Vite + TypeScript experience for Conversation Memory Voice Agent. It lets a user ask a meeting-memory question, view the contract-defined final answer, inspect chronological evidence, and select evidence for audio navigation.

The backend is not required for the current development flow. `getAnswer(question)` uses contract-aligned mock data by default and can switch to `POST /api/answer` without changing the UI components.

## Architecture

```text
App state and interaction handlers
  -> reusable UI components
  -> api/services.ts abstraction
  -> mock implementation (default) or real HTTP implementation
  -> FinalAnswerOutput / Meeting contract types
```

The UI does not fetch data directly. `App.tsx` owns the workflow state, while the components receive typed props and emit user actions.

## Folder Structure

```text
frontend/src/
  api/
    client.ts       Axios client and Authorization header
    errors.ts       User-facing API error mapping
    services.ts     Meeting, search, answer, and health services
  components/
    AnswerCard.tsx
    AudioPlayer.tsx
    DecisionTimeline.tsx
    VoiceInput.tsx
  mocks/
    answer.ts       Resolved and unresolved FinalAnswerOutput fixtures
    meetings.ts     Meeting fixtures for evidence/audio association
    index.ts        Mock exports
  types/
    index.ts        Shared snake_case API interfaces
  App.tsx           Page composition and workflow state
  App.css           Application layout and component styles
  index.css         Global reset, typography, focus styles
```

## Components

- `VoiceInput`: question textarea, submit action, example questions, and staged microphone/listening control. Voice capture does not create fake audio or call AssemblyAI yet.
- `AnswerCard`: renders `question`, `answer`, `status`, and `final_decision`. It shows no final decision when `status` is `unresolved`.
- `DecisionTimeline`: renders `evidence[]`, sorts by integer `start_time`, and emits the selected evidence item. Each item is a keyboard-accessible button.
- `AudioPlayer`: wraps the HTML Audio API. It supports browser controls, progress, current time, duration, seeking, and direct seeking from `evidence.start_time`. When no mock audio file exists, it displays a clear fallback state.

## State Management

React state in `App.tsx` is sufficient for this MVP:

- `question`: current textarea value.
- `answer`: the latest `FinalAnswerOutput`, or `null` before a search.
- `selectedEvidence`: the evidence row selected by the user.
- `isLoading`: request state used by the form and loading status.
- `error`: user-safe error message.

The answer payload is the source of truth for the evidence timeline. The selected evidence is interaction state only and is not copied into the answer payload.

## API Layer

`src/api/client.ts` creates an Axios client with:

- `VITE_API_URL`, defaulting to `http://localhost:8000/api`.
- `Authorization: Bearer <VITE_APP_API_KEY>` on protected requests.
- JSON request headers.

`src/api/services.ts` contains the endpoint functions for meetings, transcripts, segments, search, answer, and the voice tool. `getAnswerFromApi(question)` maps to `POST /answer` on the configured API base URL. `getAnswer(question)` is the UI-facing abstraction.

The health endpoint is intentionally separate from protected API routes and should remain unauthenticated when connected to the backend.

## Mock Data

Mock data lives under `src/mocks`, not in UI components. `getMockAnswer(question)` returns:

- A resolved database decision for questions containing `database` or `mongodb`.
- A resolved API redesign decision for questions containing `api`.
- An unresolved `FinalAnswerOutput` for other questions, with `final_decision: null` and an explicit answer explaining that the evidence is inconclusive.

`mockMeetings` contains three ready meetings with contract fields. Their `audio_url` values are empty because no local audio assets are currently available; this deliberately activates the audio fallback instead of requesting broken URLs.

Mock mode is enabled unless `VITE_USE_MOCK_API=false`. This keeps the backend switch explicit while making the default development experience immediately usable.

## Contract Types

`src/types/index.ts` is the shared TypeScript model for the documented JSON contract and uses snake_case field names:

- `Meeting` and `MeetingListResponse`
- `TranscriptOutput` and `Utterance`
- `Segment` and `SegmentListResponse`
- `RetrievalOutput` and `RetrievalResult`
- `FinalAnswerOutput` and `Evidence`
- `ErrorResponse` and `HealthResponse`

Integer `start_time` values are used for audio seeking. Display `timestamp` values are never parsed to control audio.

## Data Flow

1. The user submits a text question or chooses an example question.
2. `App.handleAsk` clears the prior selection, sets loading state, and calls `getAnswer(question)`.
3. The mock or real service returns `FinalAnswerOutput`.
4. `AnswerCard` renders the natural answer and final decision status.
5. `DecisionTimeline` orders `evidence[]` chronologically by `start_time`.
6. Selecting a row stores that evidence in `App` and passes its `start_time` to `AudioPlayer`.
7. `AudioPlayer` seeks directly to that integer second when a real `audio_url` is available.

## Authentication and Environment

The frontend reads only:

```text
VITE_API_URL=http://localhost:8000/api
VITE_APP_API_KEY=
VITE_USE_MOCK_API=true
```

`VITE_APP_API_KEY` is attached as a bearer token by the API client. `APP_API_KEY` belongs to the backend and is never read by frontend code. Vite environment variables are browser-visible, so this shared key is suitable only for the documented hackathon MVP and must be replaced with real user authentication for a public product.

## User States

- Empty: answer, timeline, and audio sections explain what will appear before a question is asked.
- Loading: the form is disabled and a `Searching meeting memory...` status is shown.
- Resolved: status and final decision are shown with the natural answer.
- Unresolved: the final decision heading is replaced with `Decision not resolved`; no fabricated decision is displayed.
- Error: API errors are mapped to short user-facing messages by `api/errors.ts`, while the original error is logged for development.
- No audio: the player explains that mock audio is not attached and preserves the selected source timestamp.

## Responsive and Accessibility Decisions

The layout collapses from a two-column workspace to one column on smaller screens. It uses semantic sections, labels, form controls, visible focus states, keyboard-accessible evidence buttons, `aria-current` for the selected timeline item, and accessible labels for the microphone and audio seek controls.

The visual system uses deep maroon accents, white surfaces, light neutral backgrounds, subtle borders, restrained motion, and no CSS gradients.

## Replacing Mock APIs With The Backend

1. Add `VITE_API_URL` and `VITE_APP_API_KEY` to the frontend environment.
2. Set `VITE_USE_MOCK_API=false`.
3. Ensure the backend serves the documented route at `POST /api/answer` and returns the exact `FinalAnswerOutput` shape.
4. Keep the existing `getAnswer(question)` call in `App.tsx`; the service chooses the real implementation.
5. Replace empty `Meeting.audio_url` values with backend-served audio paths when recordings are ready.

No component should need to change for the answer API swap.

## Important Assumptions

- The backend and audio assets are not ready, so mock mode is the default.
- Voice input is a non-breaking visual staging area. It does not pretend to perform transcription and does not block text questions.
- The contract's integer timestamps are authoritative for seeking. Display strings are not used as a source of truth.
- The current frontend does not introduce analytics, confidence scores, user accounts, fake meeting counts, or unsupported dashboard metrics.

## Run and Test

From the `frontend` directory:

```bash
npm install
npm run dev
```

The Vite development server uses port `5173` by default. For a production check:

```bash
npm run build
```

The current repository does not include a frontend test runner. The mock flow can be exercised immediately with the database example question, the API example question, and an unrelated question to verify resolved and unresolved states. Timeline selection can be checked by selecting each evidence row; with real audio attached, the player seeks to its `start_time`.

## Remaining Limitations

- AssemblyAI managed voice-agent integration is not implemented until the backend voice contract is ready.
- No local mock audio files are present, so the player currently displays its intentional fallback.
- Automated browser tests are not configured yet.
