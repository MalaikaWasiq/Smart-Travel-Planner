# Client Delivery Manifest

Delivery version: **1.0.0**

## Package Purpose

The client ZIP contains the complete Smart Travel Planner laptop-demonstration source. It is intentionally source-only so the recipient installs platform-specific dependencies on the destination machine.

Start with `AGENT_SETUP.md` for autonomous setup or `README.md` for the standard developer guide.

## Included

- Complete Expo/React Native frontend source and assets.
- Complete Express/MongoDB backend source.
- ML training pipeline, pinned requirements, source datasets, processed datasets, tests, model card, benchmark metrics, and runtime artifact.
- Lockfiles for reproducible Node installations.
- Environment templates with no credentials.
- Fresh-PC bootstrap, unified launcher, component launchers, and automated test suites.
- Proposal, implementation plan, feature manifest, and client documentation.

## Intentionally Excluded

- `node_modules`, `.venv`, `.expo`, `dist`, `build`, caches, bytecode, and test caches.
- `backend/.env`, `frontend/.env`, API keys, JWT secrets, database credentials, logs, and local user data.
- MongoDB database files from the development machine.
- Previous delivery ZIPs nested inside the current ZIP.
- Generated native `android` and `ios` folders; Expo regenerates them when required.

## Data And External Services

- MongoDB runs locally as a Windows service; Atlas and Docker are not required.
- Groq, OpenWeather, and OpenRouteService keys are optional and must be supplied by the client if live provider behavior is required.
- Without optional keys, documented deterministic fallbacks keep the demonstration functional.
- Hotel values are planning estimates rather than booking rates.
- OpenStreetMap tiles, Wikipedia content, and live providers require internet access.

## Verification Evidence

The release is accepted only after:

- Delivery archive contains all required source/docs and no forbidden heavy or secret files.
- Backend and frontend install successfully from lockfiles.
- Expo web export compiles.
- ML unit tests pass.
- Complete API/MongoDB integration suite passes.
- Backend and ML health checks pass using local MongoDB.
- ZIP SHA-256 is written to `delivered/SHA256SUMS.txt` beside the release.

The archive-level acceptance command is:

```powershell
.\scripts\test-client-delivery.ps1 -ZipPath ".\delivered\TravelPlanner_client_v1.0.0_<timestamp>.zip"
```

It extracts into a unique temporary folder, runs the same autonomous setup without tool installation, executes the complete suite, compiles Expo web, and removes the temporary installation.

## Version Semantics

`v1.0.0` means the agreed laptop-demonstration feature implementation is complete. It does not claim production hosting, commercial booking integration, unattended cloud push delivery, physical-device certification, or completion of the planned human usability study.

## Dependency Audit Note

At release validation, backend installation reports zero npm vulnerabilities. The Expo/React Native dependency tree reports `22` transitive findings (`9` moderate, `13` high, `0` critical), primarily in Expo CLI/Metro/native build tooling. The tested SDK-compatible lockfile is retained because `npm audit fix --force` proposes breaking ecosystem upgrades. Reassess these findings during the next supported Expo SDK upgrade before production deployment; they do not invalidate the local laptop-demonstration acceptance described above.
