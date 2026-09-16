# Smart Travel Planner

Smart Travel Planner is a React Native/Expo mobile app with a Node.js/Express backend. The current version implements the project up to the **50% milestone** in `plan.md`.

Implemented in this milestone:

- Real signup/login using JWT.
- Password hashing with bcrypt.
- Session persistence using AsyncStorage.
- MongoDB Atlas user and trip storage.
- Backend weather endpoint using OpenWeather when configured, with fallback weather data when no key is present.
- Backend trip generation and trip history.
- Expo frontend connected to backend auth, weather, and trips APIs.

## Project Structure

```text
Travel planner/
  backend/              Node.js + Express API
  frontend/             Expo / React Native app
  scripts/              Helper scripts for running and testing
  plan.md               Project roadmap and progress checklist
  run_all.ps1           Starts backend and frontend together
```

## New Machine Setup

Follow these steps when setting up the project on a new Windows machine.

### 1. Install Required Tools

Install:

- Node.js 18 or newer: `https://nodejs.org/`
- Git: `https://git-scm.com/`
- VS Code: `https://code.visualstudio.com/`
- Expo Go on your phone if you want to test on a physical device.

Verify tools in PowerShell:

```powershell
node --version
npm --version
git --version
```

### 2. Open The Project

Clone or copy the project folder to the new machine, then open PowerShell in the repo root.

Example:

```powershell
cd "F:\Travel planner"
```

If PowerShell blocks local scripts, run this once in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 3. Install Dependencies

Install backend packages:

```powershell
cd backend
npm install
```

Install frontend packages:

```powershell
cd ..\frontend
npm install
```

Return to repo root:

```powershell
cd ..
```

## MongoDB Atlas Setup

No Docker is required.

### 1. Create Atlas Cluster

1. Go to `https://cloud.mongodb.com/`.
2. Create or sign in to your MongoDB Atlas account.
3. Create a new project if needed.
4. Create a **Free / M0** cluster.
5. Name it something like `TravelPlanner`.

### 2. Create Database User

1. Go to **Database Access**.
2. Click **Add New Database User**.
3. Choose username/password authentication.
4. Save the username and password.
5. Give the user read/write access for development.

### 3. Allow Network Access

1. Go to **Network Access**.
2. Click **Add IP Address**.
3. For development, either add your current IP or use `0.0.0.0/0`.
4. Save the rule.

Using `0.0.0.0/0` is convenient for student demos, but it is not recommended for production.

### 4. Copy Connection String

1. Go to **Database**.
2. Click **Connect** on the cluster.
3. Choose **Drivers**.
4. Choose **Node.js**.
5. Copy the `mongodb+srv://...` connection string.
6. Replace `<password>` with your database user password.
7. Add the database name after the host:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/smart-travel-planner?retryWrites=true&w=majority
```

If the password contains special characters, URL-encode them. For example, `@` becomes `%40`.

## Environment Files

### Backend

Create `backend/.env` from `backend/.env.example`.

PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/smart-travel-planner?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
OPENWEATHER_API_KEY=
CORS_ORIGIN=http://localhost:8081,http://localhost:19006,http://localhost:3000
```

`OPENWEATHER_API_KEY` is optional. If it is empty, the backend uses fallback weather data.

### Frontend

Create `frontend/.env` from `frontend/.env.example`.

PowerShell:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

For emulator or web testing, keep:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

For a physical phone, replace `localhost` with your PC's LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_IP:5000/api
```

## Run The Project

From repo root, run:

```powershell
.\run_all.ps1
```

This opens two PowerShell windows:

- Backend API on port `5000` or the next free port.
- Expo frontend connected to the matching backend URL.

For phone testing, pass your PC IP:

```powershell
.\run_all.ps1 -ApiBaseUrl "http://YOUR_PC_IP:5000/api"
```

You can also run backend and frontend separately:

```powershell
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1 -ApiBaseUrl "http://localhost:5000/api"
```

## Verify The Setup

Run the 50% smoke test from repo root:

```powershell
.\scripts\test-50.ps1
```

Expected result:

```text
50% smoke test passed on port 5000
```

This test checks:

- Backend health endpoint.
- MongoDB connection.
- Signup.
- Login.
- Authenticated `/me`.
- Weather endpoint.
- Trip generation.
- Trip listing.
- Trip detail fetch.
- Trip deletion.

## Backend Endpoints

Base URL:

```text
http://localhost:5000/api
```

Available endpoints:

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /weather?city=Lahore&days=3`
- `POST /trips/generate`
- `GET /trips`
- `GET /trips/:id`
- `DELETE /trips/:id`

Trip endpoints require a JWT bearer token.

## Common Issues

### Database Is Not Configured

Cause:

- `MONGODB_URI` is missing or empty in `backend/.env`.

Fix:

- Paste the MongoDB Atlas URI into `backend/.env`.
- Restart the backend.

### MongoDB Connection Fails

Common causes:

- Wrong database username/password.
- Password contains special characters that are not URL-encoded.
- Current IP is not allowed in Atlas Network Access.
- Atlas cluster is still provisioning.

### Phone Cannot Reach Backend

Cause:

- `localhost` on a phone points to the phone, not your PC.

Fix:

- Use your PC LAN IP in `EXPO_PUBLIC_API_BASE_URL`.
- Allow port `5000` through Windows Firewall if needed.

### Weather Uses Fallback Data

Cause:

- `OPENWEATHER_API_KEY` is empty.

Fix:

- Add an OpenWeather key to `backend/.env`.
- Restart the backend.

## Current Limitations

These are planned after the 50% milestone:

- Wikipedia tourist information integration.
- HuggingFace AI itinerary generation.
- OpenRouteService routing with real coordinates.
- Dynamic hotel and budget modules tied fully to trips.
- Notifications.
- Export/share functionality.
