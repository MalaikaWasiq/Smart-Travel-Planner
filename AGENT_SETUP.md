# Autonomous Fresh-PC Setup Instructions

This document is the operating contract for an AI coding agent or technician setting up Smart Travel Planner on a new Windows 10/11 laptop. The delivered source package is designed to run without Docker, MongoDB Atlas, copied credentials, or global Python packages.

## Objective

Set up and verify the complete laptop-demonstration system:

- Expo/React Native frontend on web, with optional Android support.
- Express API on `http://localhost:5000/api`.
- Local MongoDB database on `mongodb://127.0.0.1:27017/smart-travel-planner`.
- FastAPI recommendation service on `http://127.0.0.1:8000`.
- Groq, OpenWeather, and OpenRouteService integrations when the owner supplies keys.
- Deterministic offline/fallback behavior when optional external keys are absent.

Do not use Docker or MongoDB Atlas for this delivery. Do not request, infer, copy, print, commit, or package credentials from another machine.

## Agent Rules

1. Work from an elevated 64-bit PowerShell window when installing tools or starting the MongoDB service.
2. Preserve existing `backend/.env` and `frontend/.env` files. The setup script intentionally never overwrites them.
3. Never put API keys in chat output, logs, screenshots, Markdown documentation, or the client ZIP.
4. Use `npm ci`, not `npm install`, for the first reproducible installation from lockfiles.
5. Use the repository `.venv` for Python. Do not depend on globally installed ML packages.
6. Do not report completion until `scripts/test-100.ps1` passes and both health endpoints respond.
7. Optional provider failures do not block the laptop demo because weather, itinerary, route, chat, hotel, and recommendation fallbacks are implemented and labeled.

## One-Command Setup

1. Extract the delivery ZIP to a normal writable folder such as `C:\SmartTravelPlanner`.
2. Open **PowerShell as Administrator** in that folder.
3. Allow repository scripts for this process only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

4. Run:

```powershell
.\setup_fresh_pc.ps1
```

By default the script:

- Verifies the delivery structure.
- Installs missing Node.js LTS, Python 3.12, and MongoDB Community Server through `winget`.
- Starts the local `MongoDB` Windows service.
- Generates a private random JWT secret.
- Creates environment files without external API keys.
- Installs Node dependencies from both lockfiles.
- Creates `.venv` and installs pinned ML dependencies.
- Verifies backend syntax and required model artifacts.
- Runs the complete ML/API/MongoDB integration suite.

If tools are centrally managed and must not be installed automatically:

```powershell
.\setup_fresh_pc.ps1 -InstallMissingTools $false
```

Use `-SkipDependencyInstall` or `-SkipTests` only during repeat troubleshooting. They are not valid for first-time acceptance.

## Optional Live Provider Keys

The project works without these keys using documented fallbacks. For live providers, obtain keys from the provider owners and pass them without writing them into commands that will be shared:

```powershell
$groq = Read-Host "Groq API key"
$weather = Read-Host "OpenWeather API key"
$routes = Read-Host "OpenRouteService API key"
.\setup_fresh_pc.ps1 -GroqApiKey $groq -OpenWeatherApiKey $weather -OpenRouteServiceApiKey $routes
Remove-Variable groq,weather,routes
```

The default Groq model is `qwen/qwen3.6-27b`. If Groq changes its supported models, update only `GROQ_MODEL` in `backend/.env` to a model listed in the current Groq console. Never call Groq directly from the frontend.

## Start The System

After setup:

```powershell
.\run_all.ps1
```

The launcher opens three persistent terminals for ML, backend, and Expo. A port already in use is handled by selecting the next available port and passing the selected URLs between services.

For one foreground frontend terminal with hidden child services:

```powershell
.\run_all.ps1 -NoNewWindows
```

For a physical Android phone on the same Wi-Fi network:

```powershell
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet' } | Select-Object -First 1).IPAddress
.\run_all.ps1 -ApiBaseUrl "http://${ip}:5000/api"
```

If Windows Firewall blocks the phone, allow private-network inbound TCP traffic to port `5000`. Do not expose the development API on a public network.

## Acceptance Checks

Run these after launch:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected backend result includes:

```text
ok       : True
database : connected
```

Expected ML result includes `ok: true` and model version `pakistan-content-v1.0.0`.

Then verify in the app:

1. Create an account and sign in.
2. Generate a three-day Lahore itinerary.
3. Open itinerary, map, hotels, budget, and attraction details.
4. Add an expense and confirm actual spending changes.
5. Open Travel Assistant and ask it to summarize the current budget and saved trip history.
6. Sign out, sign back in, and confirm the saved trip and chat history remain.
7. Export/share the itinerary and confirm Markdown is formatted rather than displayed as syntax.

## Troubleshooting Decision Tree

### `winget` is unavailable

Install Microsoft App Installer from the Microsoft Store, reopen elevated PowerShell, and rerun setup. Do not replace pinned project dependencies manually.

### MongoDB health is disconnected

```powershell
Get-Service MongoDB
Start-Service MongoDB
Get-NetTCPConnection -LocalPort 27017 -State Listen
```

Confirm `backend/.env` contains:

```env
LOCAL_MONGODB_URI=mongodb://127.0.0.1:27017/smart-travel-planner
```

### Frontend cannot reach the backend

- Web on the same laptop: `http://localhost:5000/api`.
- Android Studio emulator: `http://10.0.2.2:5000/api`.
- Physical phone: `http://<PC-LAN-IP>:5000/api`.
- Restart Expo after changing `EXPO_PUBLIC_API_BASE_URL`.

### Groq, weather, or route provider fails

Check only whether the corresponding variable is present; never print its value. Test the provider using the app or backend service and verify fallback metadata if it is unavailable. Provider key expiry does not prevent local demonstration.

### A terminal closes immediately

Run the relevant persistent helper directly so its error remains visible:

```powershell
.\scripts\start-ml.ps1
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1
```

## Completion Record

An agent may report setup complete only when all boxes are true:

- [ ] Node.js, npm, Python, and MongoDB are available.
- [ ] MongoDB Windows service is running.
- [ ] `backend/.env` and `frontend/.env` exist and are not exposed.
- [ ] Backend and frontend dependencies were installed from lockfiles.
- [ ] `.venv` exists and contains the pinned ML dependencies.
- [ ] `scripts/test-100.ps1` passed.
- [ ] Backend reports `database=connected`.
- [ ] ML service reports the expected model version.
- [ ] Expo web opens and the authenticated trip flow works.

Physical-device notification/share acceptance and the planned five-person usability study remain external acceptance activities, not setup failures.
