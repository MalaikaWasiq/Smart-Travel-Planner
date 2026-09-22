# Smart Travel Planner Feature Manifest

Version: **1.0.0**  
Demo implementation status: **complete**  
Platform: Expo/React Native mobile app with responsive web demonstration

## Account And Data

- Secure signup and login with bcrypt password hashing and JWT authentication.
- Persistent login through local device storage.
- User-owned MongoDB records with cross-account access protection.
- Editable traveler profile and travel preferences.
- Consent controls for recommendation interaction logging.
- Account data export and password-confirmed permanent deletion.
- Persistent saved-trip and chat history restored after signing back in.

## AI Trip Planning

- Multi-day itinerary generation from destination, duration, budget, and interests.
- Groq generation using current weather, ranked attractions, and a strict validated JSON contract.
- Configurable Groq model through `GROQ_MODEL`.
- Deterministic rule generator when Groq is missing, unavailable, timed out, or invalid.
- Generated trips are saved to MongoDB and reopened throughout the app.
- Trip regeneration and manual itinerary add, edit, delete, reorder, and replacement flows.

## Recommendation System

- Versioned Pakistan content-based cold-start attraction ranker.
- FastAPI inference service with timeout and deterministic Node fallback.
- Real tourism benchmark with checksummed source files and leakage-safe evaluation.
- Clearly labeled semi-synthetic Pakistan preference interactions for training only.
- Recommendation score, model provenance, and explanation screens.
- Consent-gated interaction logging for future personalization research.

## Travel Context

- OpenWeather current conditions and forecast when configured.
- Clearly labeled weather fallback data when the provider is unavailable.
- Wikipedia/MediaWiki attraction discovery, summaries, images, coordinates, and source links.
- Curated versioned Pakistan hotel planning catalog with budget filtering.
- Hotel selection persisted into the trip and reflected in budget calculations.
- Planning estimates and provider limitations displayed to users.

## Maps And Routes

- OpenStreetMap/Leaflet map on web and native WebView.
- Saved-trip selector and per-day route tabs.
- Daily markers, route geometry, distance, duration, and stop ordering.
- OpenRouteService driving routes when configured.
- Coordinate-based estimate fallback when the route provider is unavailable.
- Pakistan/destination-aware geocoding validation to reject wrong-country matches.
- Restored saved trips automatically populate the map after login.

## Budget And Expenses

- Dynamic hotel, food, transport, activity, and contingency estimates.
- Remaining budget and over-budget warnings.
- Actual-expense add, edit, and delete workflow.
- Estimated-versus-actual totals and category reporting.
- Recalculation after itinerary or hotel changes.
- Persistent budget alerts.

## Account-Aware Travel Assistant

- Private MongoDB-backed chat sessions and history.
- Read-only access to the authenticated user's saved trips, active itinerary, budgets, actual expenses, routes, hotels, weather, preferences, alerts, interactions, and recent chat metadata.
- Groq answers with deterministic account-aware fallback.
- Suggested follow-up actions.
- No direct model mutation of saved trips; changes require explicit preview and confirmation screens.
- Safe Markdown rendering for headings, lists, emphasis, quotes, code, and HTTPS links.

## UI, Export, And Notifications

- Professional Fraunces and Manrope typography with shared design tokens.
- Responsive mobile and centered desktop layouts.
- Dedicated itinerary, map, hotel, budget, expense, attraction, weather, alert, privacy, profile, recommendation, and chat screens.
- Offline/error/permission/empty states for primary flows.
- Safe Markdown rendering across generated narrative content.
- HTML-escaped Markdown-aware system sharing and printable PDF export.
- Local Expo notification permission, trip reminders, and server-alert scheduling.

## Security And Reliability

- Helmet security headers, CORS allowlist, API rate limiting, request validation, and sanitized errors.
- API keys remain backend-only and are excluded from deliveries.
- External request timeouts, caching, validation, and labeled fallbacks.
- Account deletion cascades through user-owned trips, chats, alerts, and interactions.
- Automated ML tests plus complete API/MongoDB ownership and lifecycle integration tests.

## External Acceptance Remaining

The source is complete for the agreed laptop demonstration. Physical Android notification/share acceptance and the planned five-person usability/accessibility study require real participants and hardware; they are intentionally not represented as automated completion.
