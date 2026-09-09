# Smart Travel Planner Implementation Plan

## Project Goal

Build the **Smart Travel Planner** described in `Project Proposal.pdf`: a mobile travel planning app that generates personalized, day-wise itineraries based on destination, days, budget, interests, weather, tourist information, maps, hotel options, and saved user preferences.

The current repository contains a modular React Native/Expo application and a Node.js/Express backend. The roadmap below records completed implementation through the connected maps, hotels, and budget milestone, followed by the research and remaining product work.

## Proposal Requirements

The app should provide:

- User authentication and profile management.
- Trip input form for destination, number of days, budget, and interests.
- AI-generated day-wise itinerary.
- Weather-aware itinerary adjustment.
- Tourist attraction information and images.
- Maps, routes, and estimated travel times.
- Hotel suggestions using free datasets or free APIs.
- Budget tracking by category.
- Trip saving, history, export, and sharing.
- Notifications for weather alerts, reminders, and budget limits.
- Cloud storage for users, trips, preferences, and history.

The proposal limits this phase to free-tier services and free/open data sources only.

## Target Tech Stack

Frontend:

- React Native with Expo.
- React Navigation.
- Axios or Fetch for API calls.
- AsyncStorage only for local session/cache, not as primary storage.

Backend:

- Node.js.
- Express.js.
- Local MongoDB Windows service.
- JWT-based authentication.
- Bcrypt password hashing.

Machine Learning research and serving:

- Python notebooks in Google Colab for reproducible experiments.
- pandas, NumPy, SciPy, scikit-learn, Surprise, and LightFM where justified by the data.
- A small FastAPI inference service only after a model passes the evaluation gate.
- Node.js remains the public application backend and calls the private ML service.

External Services:

- OpenWeather API for current weather and forecast.
- Wikipedia/MediaWiki API for attraction descriptions and images.
- OpenStreetMap and OpenRouteService for maps, routes, and travel times.
- Groq API for AI itinerary generation.
- Expo Notifications for app reminders and alerts.

## Current Repo Status

Implemented connected application modules:

- Expo frontend app.
- Splash, login, signup, home, itinerary, map, hotel, budget, and profile screens.
- Node.js/Express backend connected to the installed local MongoDB service for the laptop demo.
- JWT signup, login, session restore, and logout.
- OpenWeather integration with fallback weather data.
- Live Wikipedia/MediaWiki attraction retrieval.
- Groq-generated, validated, weather-aware itineraries with a rule-based fallback.
- Trip persistence and history.
- OpenRouteService-compatible geocoding/routing with an explicit coordinate estimate fallback.
- Versioned local hotel planning dataset, destination/budget filtering, and persisted hotel selection.
- Dynamic route-aware budget calculation and over-budget state.
- Shared current-trip state across itinerary, map, hotel, and budget screens.
- Pseudonymous recommendation interaction logging for later ML research.
- Modular frontend navigation, API client, shared components, and screen modules.
- Full trip regeneration and manual itinerary add/edit/remove/reorder persistence.
- Actual-expense add/edit/delete tracking with estimated-versus-actual budget totals.
- OpenStreetMap tile rendering with saved markers/routes on web and native WebView.
- System sharing, printable PDF export, and local Expo notification permission/reminders.
- Persisted, account-aware Groq chatbot with owned chat history, bounded read-only planner context, and deterministic fallback.
- Wikipedia-backed attraction detail screens with explicit source links.
- Evaluated real-data ML benchmark, a versioned Pakistan cold-start ranker, and a guarded FastAPI inference service.
- Persistent weather, budget, and route alerts with automatic local notification scheduling.
- Profile editing, consent controls, data export/deletion, activity replacement preview, recommendation explanations, and dedicated detail screens.
- Helmet security headers, API rate limiting, sanitized server errors, and attraction caching.

Remaining external acceptance work:

- Verify live OpenRouteService directions after a valid project key is supplied.
- Run a physical-device matrix and a five-person usability study. Android API 35 emulator and narrow/web browser QA already pass.
- Cloud push, live hotel booking inventory, traffic, and offline maps remain production extensions, not blockers for the proposal demonstration.

## Architecture

Recommended structure:

```text
Travel planner/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      app.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      api/
      components/
      context/
      navigation/
      screens/
      services/
      utils/
    App.js
    package.json
  plan.md
```

Backend responsibilities:

- Own secrets and external API keys.
- Authenticate users.
- Generate and save trips.
- Fetch weather, attraction, route, and hotel data.
- Call Groq for AI itinerary generation.
- Store user and trip data in MongoDB.

Frontend responsibilities:

- Collect user inputs.
- Display generated plans.
- Display weather, route, hotel, and budget views.
- Manage session state.
- Call backend APIs.
- Show notifications and alerts.

## Data Model

User:

```js
{
  fullName: String,
  email: String,
  passwordHash: String,
  preferences: {
    defaultBudget: Number,
    interests: [String],
    preferredHotelType: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

Trip:

```js
{
  userId: ObjectId,
  destination: String,
  days: Number,
  budget: Number,
  interests: [String],
  weather: Object,
  forecast: [Object],
  itinerary: [
    {
      day: Number,
      title: String,
      weatherNote: String,
      activities: [
        {
          time: String,
          place: String,
          type: String,
          description: String,
          estimatedCost: Number,
          latitude: Number,
          longitude: Number
        }
      ]
    }
  ],
  hotelSuggestions: [Object],
  selectedHotel: Object,
  route: {
    status: String,
    days: [
      {
        day: Number,
        distanceMeters: Number,
        durationSeconds: Number,
        coordinates: [[Number]],
        activities: [Object]
      }
    ],
    totalDistanceMeters: Number,
    totalDurationSeconds: Number
  },
  budgetBreakdown: {
    hotels: Number,
    food: Number,
    transport: Number,
    activities: Number,
    misc: Number,
    totalEstimated: Number,
    remaining: Number,
    percentUsed: Number,
    exceeded: Boolean,
    overBy: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

Recommendation interaction:

```js
{
  userId: ObjectId,
  tripId: ObjectId,
  eventType: String,
  itemType: String,
  itemId: String,
  value: Mixed,
  context: {
    destination: String,
    interests: [String],
    weatherCategory: String,
    visitMode: String,
    budgetBand: String
  },
  createdAt: Date
}
```

Only pseudonymous identifiers and recommendation-relevant context should be stored. Interaction logging must not collect unnecessary personal information.

## Backend API Plan

Authentication:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `PATCH /api/auth/me/preferences`
- `GET /api/auth/me/export`
- `DELETE /api/auth/me`

Trips:

- `POST /api/trips/generate`
- `GET /api/trips`
- `GET /api/trips/:id`
- `PATCH /api/trips/:id`
- `PATCH /api/trips/:id/itinerary`
- `PATCH /api/trips/:id/hotel`
- `POST /api/trips/:id/change-preview`
- `POST /api/trips/:id/expenses`
- `PATCH /api/trips/:id/expenses/:expenseId`
- `DELETE /api/trips/:id/expenses/:expenseId`
- `DELETE /api/trips/:id`

Weather:

- `GET /api/weather?city=Lahore&days=3`

Attractions:

- `GET /api/attractions?city=Lahore&interests=historic,nature`

Routes:

- `POST /api/routes`

Hotels:

- `GET /api/hotels?city=Lahore&budget=50000`

Budget:

- `POST /api/budget/calculate`

Recommendation data:

- `POST /api/interactions`
- `POST /api/recommendations`

Chatbot:

- `POST /api/chat`
- `GET /api/chat`
- `GET /api/chat/:id`
- `POST /api/chat/:id/messages`
- `DELETE /api/chat/:id`

Notifications:

- `GET /api/alerts`
- `PATCH /api/alerts/:id/read`
- `PATCH /api/alerts/read-all`

Expo schedules these server alerts locally after permission is granted. No cloud push-token endpoint is required for the laptop demonstration.

## Implementation Phases

## Weighted Progress Assessment

Current verified overall progress: **99% complete** (`99.0 / 100` weighted points), with the **v1.0.0 laptop-demo implementation and sanitized client delivery complete**.

This percentage was recalculated on 2026-08-11 from executable code and test evidence across the proposal requirements, ML recommendation track, chatbot, quality work, and demo readiness. The implementation required for the laptop demonstration is complete; the final one point is withheld for external physical-device and human acceptance work that cannot be truthfully simulated in code.

Scoring rules:

- A feature receives full credit only when its main user flow is implemented and verified.
- Partial implementations receive proportional credit; an API wrapper without its required key or mobile UI does not receive full credit.
- Planning, architecture text, and dataset research without executable implementation receive no implementation credit.
- Tests and documentation are scored separately and do not make an unfinished product feature complete.
- The weights total 100 and represent relative project effort and importance, not the number of checklist items.

| Scope area | Weight | Completion | Earned | Evidence and remaining gap |
|---|---:|---:|---:|---|
| Mobile frontend and professional UI/UX | 8 | 97% | 7.75 | Professional fonts/tokens, safe areas, icons, offline/permission states, and all required functional edit/detail/privacy/alert/recommendation screens render on narrow web and Android API 35; physical-device and five-user QA remain. |
| Backend, authentication, security, and data foundation | 12 | 100% | 12.0 | JWT/bcrypt auth, ownership, profile/preferences, consent, export/deletion, local Mongo persistence, rate limiting, Helmet, safe errors, and cascading cleanup are implemented and tested. |
| Trip lifecycle and personalization | 10 | 100% | 10.0 | Generate, save, list, open, delete, regenerate, hotel selection, itinerary CRUD/reorder, ranked replacement search, impact preview, confirmation, and dependent recalculation pass. |
| Live weather and adaptation | 8 | 100% | 8.0 | OpenWeather/fallback forecasts affect generation; detail/advisory UI, persistent alerts, and automatic local scheduling are connected. |
| Tourist information | 6 | 100% | 6.0 | Wikipedia candidates, summaries, images, coordinates, source links, memory caching, attraction details, and a versioned Pakistan catalog are implemented. |
| AI itinerary generation | 12 | 100% | 12.0 | Groq receives ranked live attraction/weather context, returns validated JSON, persists source metadata, and safely falls back on missing keys, timeout, API errors, or invalid output. |
| Maps, routes, and navigation | 10 | 95% | 9.5 | OSM tiles, daily markers/routes, ordering, distance/time, external directions, ORS integration, caching, and deterministic estimate fallback work; live ORS-key verification remains external. |
| Hotel module | 7 | 100% | 7.0 | Versioned source-documented planning catalog, destination/budget filters, detail UI, persisted selection, disclaimers, and budget recalculation pass. |
| Budget management | 8 | 100% | 8.0 | Estimated/actual categories, expense CRUD, remaining/over-budget state, alerts, and change-preview recalculation pass. |
| Sharing, export, and notifications | 7 | 100% | 7.0 | Text share, PDF preview/export, preference persistence, native permission flow, reminders, and server-alert-to-local scheduling are implemented. |
| ML recommendation system | 5 | 100% | 5.0 | A checksummed real benchmark, leakage-safe split, four-model comparison, real-only evaluation, semi-synthetic Pakistan training data, versioned artifacts/model card, FastAPI service, Node timeout/fallback, and UI provenance pass. |
| Context-aware chatbot | 3 | 100% | 3.0 | Owned sessions, bounded account-wide context, Groq/fallback answers, history/deletion, no direct mutation, and explicit proposed-change review are implemented and tested. |
| Testing, documentation, and demo readiness | 4 | 94% | 3.75 | ML unit tests, full API integration, web export, narrow-browser E2E, Expo Doctor, Android x86_64 build/install/launch, and native visual inspection pass; physical hardware and five-user UAT remain. |
| **Total** | **100** |  | **99.0** | **Verified overall progress: 99%. Demo implementation: 100%.** |

The project is 100% implemented for the agreed laptop demonstration. It is not labeled 100% externally accepted until physical hardware and representative-user validation are completed.

## Feature Gate Checklist

Use this section to track concrete feature gates. These historical gate labels do not calculate the weighted percentage above. A checkbox should only be marked complete when the stated behavior exists, not when only its design exists.

Verification note (2026-08-17): `scripts/test-100.ps1` rebuilt the ML artifacts, passed all ML unit tests, started the real FastAPI service, and passed the expanded API/local-MongoDB suite. Expo Doctor passed 18/18 checks, the web bundle passed, and browser flows completed successfully. Live ORS routing still requires a key that is enabled for API access.

### Gate 1 - Project Started (previously 0%)

- [x] Repository structure exists.
- [x] Proposal has been reviewed.
- [x] Basic frontend/backend folders are present.

### Gate 2 - UI Prototype Available (previously 15%)

This historical gate established the initial user-facing flow; the current repository has progressed beyond it.

- [x] Expo/React Native frontend exists.
- [x] Splash, login, signup, home, itinerary, map, hotel, budget, and profile screens exist.
- [x] App can show the intended user flow visually.
- [x] Weather and forecast are displayed in the active app (via backend).
- [x] A deterministic fallback itinerary generator exists behind the backend AI service.
- [x] Initial static hotel, map, and budget prototype data existed and has now been replaced.
- [x] Frontend code is modular and duplicate navigation is removed.
- [x] Initial frontend mock data has been removed from production screens.

### Gate 3 - Clean Frontend Foundation (previously 25%)

This historical gate established the maintainable frontend foundation used by the current backend-connected application.

- [x] One clean navigation structure is used.
- [x] `App.js` is simplified and delegates to the provider and navigator, which import screens from `src/screens`.
- [x] Screen names are consistent and not numbered.
- [x] Shared headers, buttons, auth fields, and empty states are extracted.
- [x] API client file exists in `frontend/src/api`.
- [x] Shared auth and current-trip state is implemented.
- [x] All prototype flows bundle after cleanup; Expo web production export passed.

### Gate 4 - Backend and Authentication (previously 40%)

At this point the app has a real server and user accounts.

- [x] Node.js/Express backend is created.
- [x] Backend health endpoint works.
- [x] MongoDB persistence works through `LOCAL_MONGODB_URI`; local MongoDB passed the current test.
- [x] User model is created.
- [x] Signup API works.
- [x] Login API works.
- [x] Passwords are hashed with bcrypt.
- [x] JWT authentication middleware works.
- [x] Frontend login/signup use backend APIs.
- [x] Session token is stored and restored on app restart.
- [x] Hardcoded frontend users are removed.

### Gate 5 - Real Weather and Trip Storage (previously 50%)

At this point the app starts matching the proposal's real functionality.

- [x] Trip model is created in MongoDB.
- [x] OpenWeather API service is implemented in backend (fallback used if key missing).
- [x] Frontend displays weather from backend.
- [x] Forecast is loaded according to selected destination and trip days.
- [x] Weather API errors have fallback UI.
- [x] Generated trips can be saved to local MongoDB (requires `LOCAL_MONGODB_URI`).
- [x] User can view saved trip history.

### Gate 6 - Itinerary Generation and Tourist Data (previously 65%)

At this point the core Smart Travel Planner feature works.

- [x] Wikipedia/MediaWiki attraction service is implemented.
- [x] Attractions are filtered or selected using destination and interests.
- [x] Groq itinerary service is implemented.
- [x] AI prompt includes destination, days, budget, interests, and weather.
- [x] AI prompt includes live attraction data from Wikipedia/MediaWiki.
- [x] AI output is validated before being sent to frontend.
- [x] Rule-based fallback itinerary generator exists.
- [x] Itinerary screen displays generated backend itinerary data.
- [x] Weather affects itinerary decisions such as indoor/outdoor activities.
- [x] Activity estimates include basic cost categories.

### Gate 7 - Maps, Hotels, and Budget (previously 80%)

At this point the main proposal modules are connected to the generated trip.

- [x] OpenRouteService route service is implemented with timeout and estimate fallback.
- [x] Places receive Wikipedia coordinates or OpenRouteService geocoding where possible.
- [x] Map screen displays generated trip places instead of static pins.
- [x] Daily route order, distance, and travel time are shown.
- [x] A versioned and source-documented hotel planning dataset is implemented.
- [x] Hotels are filtered by destination and accommodation budget where matches exist.
- [x] Selected hotel is saved with the trip and verified after reload.
- [x] Budget tracker uses current trip data.
- [x] Budget categories include hotel, food, transport, activities, and miscellaneous reserve.
- [x] Budget warning appears when estimated cost exceeds budget.
- [x] One complete saved trip object drives Itinerary, Map, Hotels, and Budget.
- [x] Loading, empty, timeout, and external-service fallback states are implemented.
- [x] Recommendation interaction logging is available for future real-data training.

### Gate 8 - Sharing, Notifications, Chatbot, and Polish (previously 90%)

At this point the app is demo-ready for most proposal requirements.

- [x] Itinerary sharing works.
- [x] Basic export works as text or PDF.
- [x] Expo notification permission flow is implemented.
- [x] Trip reminders can be scheduled locally on a native device.
- [x] Weather, budget, and route alerts persist with read state and schedule local notifications when refreshed.
- [x] Loading states are present for the main implemented flows.
- [x] Empty states are present for trip-dependent screens.
- [x] API error states are present for the main implemented requests.
- [x] Forms have consistent client validation and server-side validation for persisted data.
- [x] README setup guide is written.
- [x] Context-aware travel chatbot is available from the authenticated app.
- [x] Chatbot can explain the active itinerary, route, hotels, weather, and budget without directly changing saved data.
- [x] Chatbot can summarize authenticated trip history, compare budgets, report recorded expenses, preferences, active alerts, recent interactions, and prior chat metadata.
- [x] Chatbot cannot directly mutate a trip; all trip changes remain explicit user actions in edit screens.
- [x] Safe cross-platform Markdown rendering is shared by chat, itinerary, attraction, recommendation, weather, budget, and share/export narrative content.
- [x] Professional heading and body fonts are loaded consistently through Expo.
- [x] A documented design-token system controls color, typography, spacing, radius, elevation, motion, focus, offline, and permission states.
- [x] Placeholder bottom-tab letters are replaced with a professional icon set.
- [x] Missing edit, detail, preferences, expense, alert, share/export, recommendation, privacy, and chatbot screens are implemented with working contracts.
- [x] Android API 35 emulator and narrow-phone web layouts are visually verified, including keyboard-aware authentication.
- [ ] Repeat the final visual/notification pass on at least one physical Android phone.

### Gate 9 - Proposal Complete (previously 100%)

At this point the project satisfies the proposal end to end.

- [x] Full flow works: signup -> login -> generate trip -> view itinerary -> map -> hotels -> budget -> save/share.
- [x] All required demo APIs are integrated or have documented free-tier fallbacks.
- [x] MongoDB stores users, trips, preferences, selected hotels, expenses, and chat sessions.
- [x] The app can be demonstrated without manually editing data.
- [x] Backend and frontend setup steps are documented.
- [x] An idempotent fresh-PC bootstrap and autonomous agent setup contract install tools, configure local MongoDB, isolate Python dependencies, generate safe local secrets, and run final verification.
- [x] A reproducible v1.0.0 delivery builder excludes credentials, dependencies, caches, and generated builds while preserving old ZIPs and publishing SHA-256 checksums.
- [x] Automated final testing, browser E2E, and Android emulator build/install/launch verification are complete.
- [ ] Physical-device acceptance and the planned five-person usability study are complete.
- [x] Known limitations are documented.

### Phase 1: Clean Frontend Structure

Goal: make the app maintainable before adding backend logic.

Tasks:

- Decide one frontend entry structure.
- Replace the large inline `frontend/App.js` implementation with modular screens from `frontend/src/screens`.
- Rename numbered files like `1_SplashScreen.js` to normal names if needed.
- Move shared constants and mock data into `frontend/src/data`.
- Create `frontend/src/api/client.js`.
- Create a global auth/trip context or Redux store.
- Remove duplicate navigation definitions.

Acceptance criteria:

- App starts from one navigation tree.
- Screens import cleanly from `src/screens`.
- Existing prototype flow still works.

### Phase 2: Backend Foundation

Goal: create the Node.js/Express backend.

Tasks:

- Initialize backend `package.json`.
- Add Express, Mongoose, dotenv, cors, bcryptjs, jsonwebtoken, and nodemon.
- Create `src/server.js` and `src/app.js`.
- Create MongoDB connection config.
- Add `.env.example`.
- Add health endpoint `GET /api/health`.
- Add global error handler.

Acceptance criteria:

- Backend starts locally.
- `GET /api/health` returns a success response.
- Local MongoDB connection works using `.env`.

### Phase 3: Authentication

Goal: replace hardcoded users with real accounts.

Tasks:

- Create User model.
- Implement signup with validation and password hashing.
- Implement login with JWT.
- Add auth middleware.
- Connect frontend login/signup screens to backend.
- Store token locally using AsyncStorage.
- Add logout and session restore.

Acceptance criteria:

- Users can create accounts.
- Users can log in and out.
- App restores session after restart.
- Passwords are never stored in plain text.

### Phase 4: Weather Integration

Goal: replace mock weather with OpenWeather.

Tasks:

- Add OpenWeather service in backend.
- Fetch current weather and forecast by destination.
- Normalize weather response for frontend.
- Add weather fallback errors.
- Update Home screen to call backend weather endpoint.

Acceptance criteria:

- Selecting a destination shows live weather.
- Forecast matches selected trip days.
- API keys stay in backend `.env`.

### Phase 5: Attractions and Tourist Data

Goal: fetch attraction information from free public sources.

Tasks:

- Add Wikipedia/MediaWiki service.
- Search attractions by city and interest.
- Fetch descriptions and images.
- Normalize attraction objects.
- Cache common attraction results in MongoDB or memory.

Acceptance criteria:

- Generated trip can include real attraction descriptions.
- Attraction cards can show title, summary, and optional image.

### Phase 6: AI Itinerary Generation

Goal: replace mock itinerary logic with backend-generated AI plans.

Tasks:

- Add Groq service.
- Build a structured prompt using destination, days, budget, interests, weather, and attractions.
- Require JSON output from the model.
- Validate and repair AI output before returning it.
- Add fallback rule-based itinerary generation when the AI API fails.
- Save generated itinerary to MongoDB.

Acceptance criteria:

- User can generate a day-wise itinerary.
- Output includes activities, times, places, weather notes, and estimated costs.
- Rainy, hot, or cold weather affects suggested activities.
- Generated trips are saved to user history.

### Chatbot Extension Track

Goal: add a secure, context-aware travel assistant that helps users understand and refine their saved trip without exposing Groq credentials or allowing an AI response to mutate MongoDB directly.

This is an extension beyond the original core demo flow. Its authenticated, read-only account-context version is implemented and earns the full allocated `3 / 3` points. Direct model-driven mutation remains intentionally out of scope; existing proposed-change screens preserve explicit user confirmation.

#### Recommended first version

The first chatbot version should answer questions about:

- The active trip itinerary and why activities were selected.
- Weather, packing, timing, and indoor/outdoor alternatives.
- Daily route order, distance, and estimated travel time.
- Suggested hotels and how selecting one affects the budget.
- Cost categories, remaining budget, and lower-cost alternatives.
- General destination questions grounded in the trip's saved Wikipedia attraction context.
- Saved trip history and cross-trip budget comparisons.
- Recorded expenses, account preferences, active alerts, recent app interactions, and prior chat metadata.

The first version should not:

- Make bookings or claim live availability and prices.
- Give visa, legal, medical, or safety guarantees.
- Automatically edit or delete itinerary data.
- Treat Groq as the trained attraction recommendation model.
- Add a vector database or agent framework before simple trip-context prompting is measured.

#### Architecture

```text
Authenticated mobile user
  -> Chat screen or floating chat action
  -> Express chat endpoint
  -> verify JWT and trip ownership
  -> load user-owned trips, active trip, preferences, expenses, alerts, interactions, and recent chats from MongoDB
  -> build bounded, structured context
  -> Groq chat completion
  -> validate assistant response and suggested actions
  -> save sanitized conversation messages
  -> return answer to the mobile app
```

Groq must only be called by the backend. The frontend sends a message and optional `tripId`; it never receives `GROQ_API_KEY` or an unrestricted model tool interface.

#### Data model

Chat session (implemented embedded-message model):

```js
{
  userId: ObjectId,
  tripId: ObjectId,
  title: String,
  messages: [ChatMessage],
  createdAt: Date,
  updatedAt: Date
}
```

Chat message:

```js
{
  role: "user" | "assistant",
  content: String,
  suggestedActions: [String],
  model: String,
  fallbackUsed: Boolean,
  createdAt: Date
}
```

Do not store API keys, raw authorization headers, passwords, or unnecessary personal information in chat records. Limit retained message length and allow users to delete a session.

#### Context and prompt design

Send a bounded, sanitized account context assembled only from records owned by the authenticated user:

- Profile preferences without email, password hashes, tokens, or secrets.
- Up to 50 compact saved-trip summaries for account history and comparisons.
- Full bounded active-trip itinerary, normalized weather/forecast, hotels, route, budget breakdown, and recent expenses.
- Portfolio totals across planned budgets, estimated spending, recorded spending, days, destinations, and over-budget trips.
- Active alerts, consent-gated recent recommendation interactions, and prior chat metadata.
- The latest eight messages from the active conversation.

The system prompt must require the assistant to:

- Use saved trip facts before general knowledge.
- Clearly label estimated prices, routes, and fallback weather.
- Say when data is unavailable rather than inventing it.
- Keep answers concise and suitable for a mobile screen.
- Return sanitized text while server-owned quick actions remain outside model control.
- Treat user-provided text, Wikipedia content, and previous messages as untrusted data, not system instructions.

#### Safe trip changes

Use a two-step workflow for modifications:

1. The chatbot returns a structured proposed change, such as replacing one activity or selecting a hotel.
2. The frontend displays a confirmation card describing the exact effect on itinerary, route, and budget.
3. A normal validated backend trip endpoint applies the change only after confirmation.
4. Routes and budget are recalculated and the updated complete trip is returned.

The model must never receive direct MongoDB write access. Read-only contextual tools may be added later, but every tool input and output must be validated by application code.

#### Backend implementation tasks

- [x] Add an owned `ChatSession` model with bounded embedded messages and ownership indexes.
- [x] Add authenticated chat session and message routes.
- [x] Add `chatService` using the existing Groq configuration and timeout handling.
- [x] Add prompt construction with bounded account-wide and active-trip context.
- [x] Sanitize model output and enforce maximum input/output lengths.
- [x] Rate-limit chat requests and reject empty or oversized messages.
- [x] Add account-aware deterministic responses when Groq is unavailable.
- [x] Log safe failure metadata without logging prompts or API keys.
- [x] Add owned session history and deletion.
- [ ] Add optional automatic retention cleanup for old conversations if required beyond the laptop demo.

#### Frontend implementation tasks

- [x] Add a floating chat action and stack screen instead of a sixth bottom tab.
- [x] Add conversation, loading, empty, and fallback states.
- [x] Add account-level quick prompts for history, budgets, expenses, alerts, and packing.
- [x] Render server-owned suggested prompts separately from assistant text.
- [x] Keep trip changes in validated edit and proposed-change screens rather than applying chat text directly.
- [x] Refresh shared current-trip state after a confirmed modification.
- [x] Keep long answers scrollable and accessible on small mobile screens.

#### Fallback strategy

```text
Groq available -> contextual chatbot response
Groq timeout or API error -> deterministic answers for saved trip, route, hotel, weather, and budget facts
No active trip -> destination-planning guidance and prompt to generate/open a trip
Backend unavailable -> clear retry state; do not fabricate an answer on the frontend
```

#### Chatbot test plan

- Verify unauthenticated requests return `401`.
- Verify users cannot access another user's trip or chat session.
- Verify missing, empty, and oversized messages are rejected.
- Verify the Groq key never appears in frontend bundles, API responses, or logs.
- Verify active-trip questions use the correct itinerary, hotel, route, weather, and budget.
- Verify account-level questions use owned trip history, cross-trip budgets, expenses, preferences, alerts, and consent-gated interactions.
- Verify unknown information produces an explicit limitation instead of invented data.
- Verify Groq timeout, invalid JSON, and API errors use the documented fallback.
- Verify proposed trip changes do not alter MongoDB before confirmation.
- Verify a confirmed change recalculates route and budget and updates shared frontend state.
- Verify chat sessions persist, reload in order, and can be deleted by their owner.
- Verify layout and keyboard behavior on Expo web and a physical mobile device.

#### Chatbot acceptance criteria

- An authenticated user can open a chat, send messages, and reload conversation history.
- Answers are grounded in authenticated account data and the active saved trip, and clearly distinguish estimates from live facts.
- Groq is called only from the backend with timeout and fallback handling.
- Cross-user session and trip access is blocked.
- No trip mutation occurs without explicit confirmation.
- The mobile interface handles loading, errors, long messages, and the on-screen keyboard.
- Automated tests cover authentication, ownership, validation, fallback, persistence, and confirmation behavior.

### Recommendation System Research Track

Goal: rank the attractions that should be considered before Groq organizes them into an itinerary.

The recommendation system and Groq have separate responsibilities:

```text
User preferences
  -> live Pakistan attraction candidates
  -> recommendation model ranking
  -> weather, distance, and budget reranking
  -> top attractions
  -> Groq itinerary organization and descriptions
```

#### Dataset decision

Do not use `10.17632/ttvm4cr25s`; it is unrelated mixed-logit MATLAB code. The corrected dataset associated with the cited tourism paper is `10.17632/h58s544674.1`.

Use a three-layer data strategy:

1. Real external benchmark data:
   - Use the corrected Huda tourism dataset for explicit ratings, user geography, attraction type, visit mode, and time context.
   - Use it to compare algorithms reproducibly, not to claim direct knowledge of Pakistani attractions.
   - Optionally use Foursquare NYC/Tokyo or Gowalla for a separate implicit-feedback and spatiotemporal benchmark.

2. Real Pakistan catalog and interactions:
   - Build a canonical attraction catalog from Wikipedia, OpenStreetMap, and reviewed local data.
   - Assign stable internal attraction IDs and retain source IDs, names, categories, city, coordinates, and provenance.
   - Collect consented, pseudonymous app interactions and optional explicit ratings.
   - For a university study, target at least 100 participants with 10 attraction ratings each; 300 participants with 15 ratings each is preferred.

3. Semi-synthetic augmentation:
   - Generate interactions only against real Pakistan attraction metadata.
   - Define transparent traveler archetypes such as history-focused, nature-focused, family, food, adventure, budget, and luxury.
   - Derive synthetic scores from category affinity, budget compatibility, distance, weather suitability, and controlled random noise.
   - Calibrate rating frequency, sparsity, and popularity using the real benchmark or collected survey data.
   - Tag every generated row with `dataOrigin=semi_synthetic`, generator version, seed, and archetype.

Fully synthetic data is allowed only for API tests, load tests, demonstrations, and pipeline debugging. It must not be mixed into the final real-data test set or used alone to support accuracy claims.

#### Model candidates and decision rule

Train and compare these models instead of selecting one blindly:

- Popularity or Bayesian weighted ranking as the mandatory non-personalized baseline.
- Item-based KNN with cosine similarity as an explainable collaborative-filtering baseline.
- SVD matrix factorization for explicit 1-5 rating prediction.
- Content-based cosine similarity for new users and unseen Pakistani attractions.
- LightFM with WARP as the preferred hybrid top-K candidate because it can combine interactions with user and item features.

Do not start with a deep neural recommender. The corrected benchmark has only 30 items and sparse user histories, so a deep model is not justified unless a later dataset is substantially larger and it beats simpler baselines under the same split.

Choose the production model only after evaluation:

- Primary decision metrics: NDCG@10 and Recall@10.
- Guardrail metrics: Precision@10, MAP@10, Hit Rate@10, catalog coverage, diversity, and cold-start performance.
- RMSE and MAE are reported for explicit-rating models but do not decide the final top-K ranker by themselves.
- Use temporal leave-last-one-out where timestamps are reliable; otherwise use per-user holdout.
- Never use a random row split that leaks a user's future history into training.
- Report warm-user, cold-user, and new-item results separately.
- Prefer LightFM only if it improves ranking or cold-start results materially over the baselines. Otherwise deploy the best measured simpler model.

#### Six-cell Colab research workflow

Only one major notebook cell is produced per response, and execution output must be reviewed before creating the next cell.

Cell 1 - acquisition and schema discovery:

- Download `h58s544674.1`, verify the archive, extract it, and print filenames, workbook sheets, shapes, dtypes, and columns.
- Stop after showing the code and wait for actual output.

Cell 2 - relational EDA:

- Inspect missing values, duplicates, key integrity, rating distribution, interactions per user/item, matrix sparsity, temporal coverage, visit modes, and cold-start cohorts.
- Visualize the useful distributions and stop for output review.

Cell 3 - preprocessing and split:

- Join tables using discovered keys, preserve explicit ratings, create documented positive implicit interactions, build user/item features, encode IDs, and create leakage-safe train/validation/test splits.
- Keep a real-only test set. Semi-synthetic data may be added only to training and must remain identifiable.

Cell 4 - model training:

- Train popularity, item-KNN, SVD, content-based, and LightFM-WARP candidates using a fixed random seed and a small documented validation search.
- Save models, mappings, feature schemas, and configuration. Do not evaluate on the final test set.

Cell 5 - final evaluation:

- Evaluate rating and top-K metrics, coverage, diversity, warm/cold cohorts, and real-only versus augmented training.
- Include an ablation comparing real-only training against real plus semi-synthetic training.
- Select a model only if the result is supported by the predefined metrics.

Cell 6 - inference and export:

- Implement `recommend(user_id, candidate_items, context, top_k=10)`.
- Return attraction ID, name, score, type, reason, model version, and fallback source.
- Export the model, encoders, feature mappings, schema, metrics, model card, and reproducible inference examples.

#### Production fallback chain

```text
Known user with enough history -> evaluated hybrid or collaborative model
New user with stated interests -> content-based ranking
No history and no preferences -> destination-aware popularity
Model service unavailable -> deterministic content and context rules
```

#### Integration gate

Do not connect the notebook model to the production trip flow until all of the following are true:

- The model artifact and feature mappings reload successfully in a clean runtime.
- The final evaluation uses untouched real data.
- The selected model beats the popularity baseline on NDCG@10 and Recall@10.
- Cold-start behavior is measured and has a defined fallback.
- A FastAPI inference contract is versioned and tested.
- Node.js can time out safely and continue with content/rule-based ranking.

Acceptance criteria:

- The research is reproducible from dataset download through saved model.
- Dataset provenance and synthetic-data origin are explicit.
- At least three meaningful baselines are compared.
- The selected ranker is justified by real-data metrics, not model complexity.
- Groq receives ranked attractions rather than replacing the recommendation model.

#### Implemented ML evidence (2026-08-11)

- [x] Downloaded the real Huda tourism files from Mendeley Data and verified published checksums.
- [x] Parsed 52,930 raw transactions and retained 45,275 unique user-item interactions across 30 attractions.
- [x] Used chronological leave-last-unique-item-out with 7,934 untouched real test users.
- [x] Compared popularity, content profile, item-KNN cosine, and truncated SVD rankers.
- [x] Selected item-KNN on the real benchmark: Recall@10 `0.946811`, NDCG@10 `0.574998`.
- [x] Confirmed the popularity baseline was lower: Recall@10 `0.596673`, NDCG@10 `0.247636`.
- [x] Generated 2,800 explicitly labeled semi-synthetic Pakistan interactions against a 30-item real attraction catalog; none enter the real benchmark test set.
- [x] Exported metrics, a model card, and the versioned runtime artifact `pakistan-content-v1.0.0`.
- [x] Implemented and tested FastAPI `GET /health` and `POST /recommend` contracts.
- [x] Integrated Node.js timeout/version handling and deterministic content fallback.
- [x] Ranked candidates before Groq itinerary organization and exposed recommendation reasons/model provenance in the app.

### Phase 7: Maps and Routes

Goal: replace fake map pins with real coordinates and routes.

Tasks:

- Add OpenRouteService backend integration.
- Geocode each activity using both place name and destination; cache successful coordinates.
- Calculate routes separately for each itinerary day.
- Store ordered waypoints, GeoJSON coordinates, distance in meters, and duration in seconds.
- Preserve the itinerary and save `route.status=unavailable` when geocoding or routing fails.
- Update Map screen to consume trip route data.
- Use a real map component for native app targets if compatible.

Acceptance criteria:

- Map shows trip activities with real coordinates.
- Route summary shows per-day and total travel time, distance, and activity order.
- Route data comes from saved/generated trip data.

### Phase 8: Hotels

Goal: provide hotel suggestions under free-tier constraints.

Tasks:

- Create a versioned, source-documented hotel dataset for supported Pakistani destinations.
- Use a live hotel API only if its terms, free-tier stability, price semantics, and attribution requirements are verified.
- Do not present invented or stale prices as live prices.
- Filter hotels by city, price, rating, and budget.
- Return hotel suggestions as part of the complete generated trip.
- Save the selected hotel through `PATCH /api/trips/:id/hotel`.
- Recalculate and persist the budget after hotel selection.

Acceptance criteria:

- Hotels are filtered by destination.
- Selected hotel affects trip budget.
- Hotel selection persists with the trip.

### Phase 9: Budget Tracker

Goal: make budget tracking dynamic instead of hardcoded.

Tasks:

- Estimate hotel cost from price per night and trip nights.
- Estimate food from itinerary activities or a documented per-day fallback.
- Estimate transport from route distance with a documented base fare and cost-per-kilometer fallback.
- Estimate admission/activity costs and a configurable miscellaneous reserve.
- Generate category breakdown for each trip.
- Show total budget, estimated cost, remaining, percentage used, and over-budget amount.
- Warn when estimated total exceeds budget.
- Allow manual expense edits.

Acceptance criteria:

- Budget screen reflects the current selected trip.
- Budget categories are calculated from trip data.
- User receives warning when budget is exceeded.
- Every estimate exposes whether it came from trip data, a dataset value, or a fallback assumption.

### Phase 10: Trip History, Export, and Sharing

Goal: complete the user workflow after trip generation.

Tasks:

- Add saved trips list to Profile screen.
- Add trip detail view.
- Implement share using React Native Share API.
- Add basic itinerary export as text or PDF if feasible.
- Add delete/update trip actions.

Acceptance criteria:

- Users can view past generated trips.
- Users can share an itinerary.
- Users can delete or update saved trips.

### Phase 11: Notifications

Goal: provide reminders and alerts from the proposal.

Tasks:

- Add Expo Notifications setup.
- Ask for notification permission.
- Configure the Android notification channel for local delivery.
- Schedule trip reminders locally.
- Persist weather, budget, and route alerts and schedule unread alerts locally when refreshed.

Acceptance criteria:

- App can schedule local reminders.
- Budget, weather, and route alerts appear in-app and can be delivered locally after permission is granted.
- Weather alert logic works from forecast data.

### Phase 12: Testing and Final Polish

Goal: prepare the app for demo and evaluation.

Tasks:

- Add backend route tests for auth, trips, weather, and budget.
- Add frontend smoke tests where feasible.
- Add loading, empty, and error states.
- Validate forms consistently.
- Remove unused dependencies and duplicate code.
- Add project README with setup steps.

Acceptance criteria:

- Frontend starts without runtime errors.
- Backend starts without runtime errors.
- Core demo flow works end to end:
  signup -> login -> enter trip details -> generate itinerary -> view map/hotels/budget -> save/share trip.

### Phase 13: Professional UI/UX Polish and Missing Screens

Goal: turn the functional mobile application into a coherent, professional travel product while adding the user-facing screens required for unfinished update, detail, preferences, expense, notification, export, recommendation, and chatbot workflows.

This phase is already represented by the `Mobile frontend and professional UI/UX` weight and by the relevant product-feature weights in the progress table. It must not be counted twice when calculating completion.

#### Current implementation status

- [x] Add Expo SDK-compatible `expo`, font, splash-screen, and Ionicons dependencies to `package.json`.
- [x] Load `Fraunces` and `Manrope` before navigation and coordinate native splash hiding.
- [x] Add shared semantic color, typography, font, spacing, radius, and elevation tokens.
- [x] Add reusable `AppText` and `AppIcon` components.
- [x] Replace bottom-tab placeholder letters with accessible Ionicons.
- [x] Make shared screen headers safe-area aware.
- [x] Add a functional `TripSummaryScreen` driven by the shared saved trip.
- [x] Add a functional `TravelPreferencesScreen` with authenticated MongoDB persistence.
- [x] Reuse saved default budget and interests on the Home trip form.
- [x] Add a functional `SettingsScreen` describing local demo storage and external data sources.
- [x] Configure `LOCAL_MONGODB_URI` as the laptop-demo database override.
- [x] Verify local preference persistence through the end-to-end smoke test.
- [x] Verify Expo dependency compatibility and production web export.
- [x] Add working trip-regeneration and itinerary add/edit/remove/reorder screens.
- [x] Add attraction detail, expense entry/history, share/PDF, notification, and chatbot/history screens backed by working contracts.
- [x] Add real OpenStreetMap tile rendering on web and native through a shared component.
- [x] Verify the expanded backend flow against local MongoDB with `scripts/test-80.ps1`.
- [x] Migrate every existing screen text element to the shared typography component while preserving screen-specific layout styles.
- [x] Complete the full token system for motion, focus, offline, and permission states.
- [x] Add the remaining recommendation explanation, proposed-change review, privacy, profile-edit, and dedicated alerts screens.
- [x] Verify narrow-phone web, Android API 35 emulator, keyboard-aware authentication, production export, and native dependency compatibility.
- [ ] Complete the final physical-Android and five-user accessibility/usability acceptance pass.

#### Visual direction

Keep the established Pakistan travel identity, but refine it into an editorial travel-guide aesthetic:

- Use deep forest, warm mineral green, parchment, sand, charcoal, and restrained amber accents.
- Use subtle topographic lines, route traces, paper grain, or destination photography to create depth instead of flat single-color screens.
- Reserve gradients for major headers, hero moments, and route/weather states rather than every button or card.
- Use clear hierarchy, generous whitespace, fewer card borders, and consistent alignment.
- Avoid purple-heavy styling, generic dashboard layouts, excessive rounded cards, and decorative elements that do not communicate travel information.

#### Professional typography

Recommended Expo font pairing:

- `Fraunces` for destination titles, important numbers, and editorial section headings.
- `Manrope` for body text, labels, buttons, forms, and dense itinerary information.
- Use system fallback only while fonts load; do not use Arial, Roboto, or Inter as the intended visual identity.

Implementation tasks:

- Add `expo-font`, `expo-splash-screen`, `@expo-google-fonts/fraunces`, and `@expo-google-fonts/manrope` using Expo-compatible versions.
- Load fonts before rendering navigation and keep the native splash visible until loading completes.
- Define named type tokens such as `display`, `title`, `heading`, `body`, `label`, and `caption`.
- Define line height, letter spacing, weight, and maximum text width for every token.
- Verify long destination, hotel, and attraction names do not clip at supported text scaling levels.

#### Design system foundation

Create reusable theme tokens for:

- Semantic colors: background, surface, elevated surface, text, muted text, border, primary, success, warning, danger, weather, and route states.
- Typography families, sizes, weights, line heights, and letter spacing.
- Spacing on a consistent 4-point scale.
- Radius levels for controls, cards, sheets, and circular elements.
- Elevation/shadow levels that work on Android, iOS, and web.
- Minimum touch targets of 44 by 44 points.
- Motion durations and easing for navigation, loading, sheet, success, and error transitions.

Extract or add reusable components only where behavior and styling repeat:

- `AppText` and heading variants.
- `AppIcon` backed by one Expo-compatible icon library.
- `Button` variants with loading and disabled states.
- `TextField`, `SelectField`, date input, and validation message.
- `Screen`, `AppHeader`, `SectionHeader`, and `BottomSheet`.
- `TripCard`, `ActivityCard`, `HotelCard`, `BudgetSummary`, and `WeatherCard`.
- `Skeleton`, `EmptyState`, `ErrorState`, and offline/retry banner.
- Confirmation and destructive-action dialogs.

Do not create wrappers that only rename a native component without adding shared semantics, accessibility, or styling value.

#### Navigation structure

Keep five primary bottom tabs to avoid overcrowding:

```text
Home | Map | Hotels | Budget | Profile
```

Use stack screens, sheets, and contextual actions for secondary workflows:

- A floating chat action opens the chatbot stack/modal.
- Itinerary header actions open edit, share, export, and trip-summary screens.
- Profile opens preferences, notifications, privacy, and saved-trip details.
- Budget opens expense entry and expense history.
- Attraction and hotel cards open detail screens.

Replace single-letter tab marks with consistent outlined/filled icons and accessible labels.

#### Missing screens to add

Core trip update screens:

- `TripSummaryScreen`: one polished overview of dates/days, weather, route, hotel, budget, and primary actions.
- `EditTripScreen`: update destination, dates/days, budget, and interests with a clear re-generation warning.
- `EditItineraryScreen`: add, remove, replace, edit, and reorder activities by day.
- `ActivitySearchScreen`: search or choose replacement activities from real attraction candidates.
- `ChangeReviewScreen`: show exactly how an update changes route, time, and budget before confirmation.

Information and personalization screens:

- `AttractionDetailScreen`: Wikipedia image, summary, source link, location, estimated cost, weather suitability, and add/replace action.
- `WeatherDetailScreen`: forecast, source/fallback label, travel advisory, packing suggestions, and refresh state.
- `HotelDetailScreen`: image, rating estimate, amenities, location, price disclaimer, stay total, and select action.
- `EditProfileScreen`: update name and supported profile information.
- `TravelPreferencesScreen`: default budget, interests, hotel preference, onboarding ratings, and data-consent controls.
- `SettingsScreen`: API/data attribution, theme/accessibility preferences, cache/session controls, and app information.
- `PrivacyDataScreen`: explain stored trip/chat/interaction data and allow supported deletion requests.

Budget, alert, and completion screens:

- `AddExpenseScreen`: category, amount, date, note, and optional trip-day association.
- `ExpenseHistoryScreen`: actual versus estimated spending with edit/delete controls.
- `NotificationSettingsScreen`: reminder, weather-alert, and budget-alert controls after notification infrastructure exists.
- `AlertsScreen`: in-app weather, budget, route, and reminder notices with read state.
- `ShareExportScreen`: preview and choose system share, text export, or PDF export.
- `ExportPreviewScreen`: mobile-friendly itinerary preview before PDF generation or sharing.

Recommendation and chatbot screens:

- `PreferenceOnboardingScreen`: select interests and optionally rate initial attractions for cold-start recommendations.
- `RecommendationExplanationScreen`: explain why an attraction was suggested and expose feedback controls.
- `ChatScreen`: active contextual conversation with quick prompts and suggested actions.
- `ChatHistoryScreen`: reopen and delete owned chat sessions.
- `ProposedChangeScreen`: review and confirm chatbot-proposed trip changes.

Do not build empty placeholder screens. A screen is complete only when its backend contract, state handling, and user action work or it is explicitly identified as a non-interactive prototype.

#### Interaction and motion

- Use a short staged reveal on the Home and Trip Summary screens, not animation on every card.
- Animate itinerary day changes and route-selection changes with restrained transitions.
- Use skeletons for weather, trip generation, saved trips, and chatbot history.
- Show explicit progress stages during long generation: gathering weather, finding attractions, generating plan, calculating route, and estimating budget.
- Respect reduced-motion settings and avoid animation that blocks input.
- Keep success feedback persistent enough to be understood; do not rely only on temporary toasts.

#### Mobile responsiveness and accessibility

- Test at small Android widths, common phone widths, large phones, tablets, and Expo web.
- Use safe-area insets for headers, bottom tabs, sheets, and devices with cutouts.
- Use keyboard-aware layouts for authentication, trip forms, expenses, profile editing, and chat.
- Ensure scroll views do not hide focused fields or confirmation buttons.
- Provide accessibility roles, labels, hints, focus order, and selected/disabled states.
- Meet WCAG AA contrast for normal text and do not communicate status by color alone.
- Support text scaling without clipping critical controls.
- Add visible focus states for Expo web keyboard navigation.
- Provide useful alt/accessibility labels for destination and attraction images.

#### Content and data presentation

- Standardize date, time, distance, temperature, and PKR formatting.
- Clearly label `live`, `cached`, `estimated`, and `fallback` data.
- Keep hotel estimate disclaimers close to price, not hidden in settings.
- Show source attribution for Wikipedia, OpenWeather, OpenRouteService/OpenStreetMap, Groq-generated text, and local datasets.
- Use concise mobile copy and explain consequences before destructive or expensive actions.
- Provide realistic empty states that lead to the next action rather than decorative illustrations only.

#### UI implementation order

1. Introduce fonts, tokens, icon system, safe-area foundation, and reusable states without changing feature behavior.
2. Polish authentication, Home, Itinerary, Map, Hotels, Budget, and Profile one flow at a time.
3. Add Trip Summary, edit/review, attraction details, weather details, hotel details, profile/preferences, and settings.
4. Add expense, alerts, share/export, recommendation feedback, and chatbot screens only with their backend contracts.
5. Run cross-device visual QA and correct clipping, keyboard, spacing, contrast, and loading problems.

#### UI testing and visual QA

- Verify every screen at narrow phone, standard phone, large phone, and web widths.
- Test Android back behavior, tab restoration, deep stack navigation, and modal dismissal.
- Test keyboard open/close, multiline chat, validation errors, and long localized-style content.
- Test loading, empty, offline, timeout, permission-denied, over-budget, and destructive-confirmation states.
- Test font loading on cold start and ensure no unstyled navigation flash.
- Capture approved reference screenshots for critical screens and compare them during later changes.
- Run Expo production export and at least one physical Android demo after each major UI pass.
- Conduct a small usability test with at least five representative users before final acceptance.

#### UI polish acceptance criteria

- Fonts, icons, colors, spacing, radius, elevation, and motion come from documented shared tokens.
- All implemented screens use the same professional visual language and content formatting.
- Required missing screens have working data/state contracts rather than static placeholders.
- Main workflows are usable without clipped text or hidden controls on a small Android screen.
- Loading, empty, error, fallback, offline, and confirmation states are visually consistent.
- Accessibility labels, contrast, touch targets, text scaling, and reduced motion are verified.
- Physical Android and Expo web visual QA pass with approved reference screenshots.
- User testing findings are recorded and high-severity usability issues are resolved.

## Environment Variables

Backend `.env.example` should include:

```env
PORT=5000
LOCAL_MONGODB_URI=mongodb://127.0.0.1:27017/smart-travel-planner
JWT_SECRET=replace-with-a-long-random-secret
OPENWEATHER_API_KEY=replace-with-openweather-key
GROQ_API_KEY=replace-with-groq-key
GROQ_MODEL=qwen/qwen3.6-27b
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_TIMEOUT_MS=25000
OPENROUTESERVICE_API_KEY=replace-with-openrouteservice-key
```

Frontend `.env.example` should include:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Demo-Ready Minimum Version

If time is limited, build this minimum version first:

- Real backend with auth.
- MongoDB user and trip storage.
- OpenWeather integration.
- Groq itinerary generator using real weather and live attractions, with a rule-based fallback.
- Versioned Pakistan hotel dataset.
- Dynamic budget tracker.
- Trip history.

This version will satisfy the main academic proposal better than a UI-only prototype, even if richer attraction data and advanced routing are added later.

## Risks and Mitigations

Risk: free-tier APIs may fail or rate-limit.

Mitigation: cache results and keep local fallback datasets.

Risk: AI output may be malformed.

Mitigation: validate JSON and keep a rule-based fallback generator.

Risk: mobile map libraries can be difficult across Expo web/native.

Mitigation: keep a simple fallback map summary for web and use native map support only where stable.

Risk: scope is too large for one iteration.

Mitigation: finish the demo-ready minimum version before adding premium features.

Risk: the external tourism benchmark contains Indonesian attractions and cannot directly represent Pakistani catalog items.

Mitigation: use it for algorithm benchmarking only; build a canonical Pakistan catalog and collect local interactions for production training.

Risk: collaborative filtering performs poorly for new users and sparse histories.

Mitigation: require popularity and content-based fallbacks, evaluate cold-start cohorts separately, and collect explicit onboarding interests or ratings.

Risk: semi-synthetic interactions may encode assumptions rather than real traveler behavior.

Mitigation: label generated rows, version the generator, keep the final test set real-only, run a real-only versus augmented ablation, and reject augmentation if it does not improve real-data ranking metrics.

Risk: recommendation metrics can be inflated by leakage or popularity bias.

Mitigation: use temporal or per-user holdout, remove previously seen items from candidates, report coverage and diversity, and freeze the test set before tuning.

## Suggested Timeline

Iteration 1 - data contracts and observability:

- Extend Trip for daily routes, hotel suggestions, selected hotel, and complete budget data.
- Add stable attraction identifiers and interaction logging before ML work begins.
- Define service fallbacks and fixture-based tests.

Iteration 2 - complete the 80% application milestone:

- Implement geocoding and daily OpenRouteService routes.
- Add the versioned Pakistan hotel dataset and hotel-selection persistence.
- Implement dynamic budget estimation and one complete saved trip response.
- Replace mock Map, Hotel, and Budget screen data while preserving one shared current trip.

Iteration 3 - real data foundation:

- Build and validate the Pakistan attraction catalog.
- Prepare the user study or rating survey with consent and anonymization.
- Begin collecting app interactions without blocking recommendation requests.

Iteration 4 - six-cell ML experiment:

- Run schema discovery, EDA, preprocessing, model comparison, final evaluation, and artifact export one reviewed cell at a time.
- Compare real-only training with real plus semi-synthetic augmentation.
- Produce a model card and select the model only through the predefined gate.

Iteration 5 - guarded ML integration:

- Add the private FastAPI inference service.
- Add Node.js timeout, version checks, logging, and deterministic fallbacks.
- Pass ranked candidates to Groq and verify the full trip flow.

Iteration 6 - remaining proposal work:

- Establish the professional font, design-token, icon, safe-area, and accessibility foundation.
- Add the missing update/detail/preferences/expense/alert/share/chatbot screens alongside their backend contracts.
- Add sharing/export, notifications, broader tests, documentation, cross-device visual QA, and demo preparation.

## Research References

- Correct tourism ratings dataset: `https://data.mendeley.com/datasets/h58s544674/1`
- Associated data paper: `https://pmc.ncbi.nlm.nih.gov/articles/PMC10788210/`
- Foursquare POI check-in datasets: `https://sites.google.com/site/yangdingqi/home/foursquare-dataset`
- Gowalla check-in dataset: `https://snap.stanford.edu/data/loc-gowalla.html`
- TourPedia places and reviews: `https://wafi.iit.cnr.it/openervm/about/datasets.html`
- LightFM hybrid recommender: `https://github.com/lyst/lightfm`
- OpenRouteService directions documentation: `https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/`

## Final Success Criteria

The project should be considered complete for the proposal when:

- The app uses a real backend instead of hardcoded users.
- Trips are generated from user inputs.
- Weather affects itinerary decisions.
- Trips are saved in local MongoDB.
- Hotels and budget are tied to the selected trip.
- The map/route screen uses generated trip data.
- User can view trip history and share/export an itinerary.
- Attraction ranking has documented data provenance and a deterministic cold-start fallback.
- Any deployed ML model beats the predefined popularity baseline on untouched real test data.
- Synthetic or semi-synthetic records are identifiable and are never used as the sole final evaluation set.
- The app can be demonstrated end to end without manually editing code.
