# Xeno Copilot

Xeno Copilot is an AI-native marketing workflow built for the Xeno engineering assignment.

It is intentionally not a generic CRM. The product focuses on one deep workflow:

1. A marketer describes a campaign goal in natural language.
2. The copilot turns that goal into a segment, a channel recommendation, and channel-specific copy.
3. The campaign is launched through a separate channel service.
4. Callback events flow back into the CRM and update the campaign state.
5. The dashboard summarizes results and recommends the next move.

The demo is designed to feel like an AI marketing employee, not a text generator.

## What Is Included

- Chat-based AI campaign copilot
- Customer explorer with search, filters, and order history
- Campaign dashboard with metrics and summaries
- Live communication timeline
- Separate channel service with simulated delivery/open/click/purchase events
- Idempotent webhook handling and event history storage
- Docker support for the full stack
- Netlify-ready frontend deployment
- Step-by-step docs and demo transcript

## What Is Deliberately Not Included

To stay focused on the assignment, this submission does not include:

- Lead management
- Sales pipeline stages
- Support tickets
- Role management UI
- Billing
- Inventory
- Store management
- Complex authentication
- Large reporting suites

## Repository Layout

```text
xeno-pulse-crm/
  backend/
  channel-service/
  docs/
  frontend/
    api/
  docker-compose.yml
  .env.example
  frontend/vercel.json
```

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose
- Channel service: Node.js, Express, TypeScript
- Deployment: Vercel for frontend, separate Node host for backend and channel service

## Prerequisites

Install these first:

- Node.js 20 or newer
- npm
- MongoDB Atlas or a local MongoDB instance
- Docker Desktop if you want the container flow
- VS Code or another editor

The default local backend environment uses the MongoDB service on `mongodb://127.0.0.1:27017/xeno`, so make sure MongoDB is running before you start the backend.

If PowerShell blocks `npm`, use `npm.cmd` in the same commands below.

## Step 1. Open The Project

From File Explorer:

1. Open the project folder.
2. Right-click the folder.
3. Choose `Open in Terminal` or `Open with Code`.

From PowerShell:

```powershell
cd "C:\Users\uthej\Documents\New project\xeno-pulse-crm"
```

If you create the fresh desktop copy later, the path will be something like:

```powershell
cd "C:\Users\uthej\Desktop\Xeno-Copilot"
```

## Step 2. Install Dependencies

Run these one by one:

### Backend

```powershell
cd backend
npm.cmd install
```

### Channel Service

```powershell
cd ..\channel-service
npm.cmd install
```

### Frontend

```powershell
cd ..\frontend
npm.cmd install
```

## Step 3. Set Environment Variables

Copy the example files and fill in the real values:

- `backend/.env.example` -> `backend/.env`
- `channel-service/.env.example` -> `channel-service/.env`
- `frontend/.env.example` -> `frontend/.env`

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/xeno
CLIENT_URLS=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000/api
CHANNEL_SERVICE_URL=http://localhost:5100/api/simulations
WEBHOOK_SECRET=xeno-demo-secret
SIMULATION_SPEED=0.45
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

### Channel Service `.env`

```env
PORT=5100
NODE_ENV=development
WEBHOOK_SECRET=xeno-demo-secret
SIMULATION_SPEED=0.45
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Step 4. Run The App Locally

Open three terminals.

### Terminal 1 - Backend

```powershell
cd backend
npm.cmd run dev
```

### Terminal 2 - Channel Service

```powershell
cd channel-service
npm.cmd run dev
```

### Terminal 3 - Frontend

```powershell
cd frontend
npm.cmd run dev
```

### Local URLs

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`
- Channel service health: `http://localhost:5100/api/health`

## Step 5. How To Operate The Website

Start here:

1. Open `http://localhost:5173`
2. Go to `AI Copilot`
3. Click `Refresh demo data` if you want a clean seeded workspace
4. Paste a business goal such as:

```text
Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days.
```

5. Click `Build campaign plan`
6. Review the audience, channel choice, copy variants, and reasoning
7. Click `Launch campaign`
8. Watch the live event stream fill up with webhook-backed callback events
9. Move to `Customers` to inspect customer records and order history
10. Move to `Campaigns` to inspect campaign summaries
11. Move to `Timeline` to inspect the event stream in order

### Customer Management

On the `Customers` screen you can:

- Click `Add customer` to create a new profile
- Select a customer and click `Edit customer` to update the profile
- Select a customer and click `Delete customer` to remove it from the active audience

Deletion is soft delete, so the campaign history stays intact while the customer is hidden from the active list.

If the frontend shows a `Network Error`, check two things first:

1. The backend is running on port `5000`
2. MongoDB is available at the URI in `backend/.env`

## Step 6. Build Check

Before committing or deploying, run a production build in each package:

### Backend

```powershell
cd backend
npm.cmd run build
```

### Channel Service

```powershell
cd ..\channel-service
npm.cmd run build
```

### Frontend

```powershell
cd ..\frontend
npm.cmd run build
```

## Step 7. Docker

If you want to run the full stack with one command:

```powershell
cd "C:\Users\uthej\Documents\New project\xeno-pulse-crm"
docker compose up --build
```

Docker starts:

- MongoDB
- Channel service on port `5100`
- Backend on port `5000`
- Frontend on port `5173`

## Step 8. Vercel Deployment

Vercel only hosts the frontend, so the backend and channel service must be deployed separately.

The frontend now calls `/api` in production. Vercel serves the React app and proxies `/api/*` requests to the Render backend through the Vercel function in `frontend/api`.

### Frontend on Vercel

1. Push the repo to GitHub.
2. Create a new project in Vercel from the GitHub repo.
3. Set the root directory to `frontend`.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Add this environment variable in Vercel:

```env
BACKEND_API_URL=https://<your-backend-domain>/api
```

7. Deploy the project.
8. Keep `frontend/vercel.json` in the repository so SPA routing works.

### Backend Deployment

Deploy the backend to Render, Railway, Fly.io, or another Node-friendly host.

Required backend env vars:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=<your-atlas-or-hosted-mongo-uri>
CLIENT_URLS=https://<your-vercel-domain>
PUBLIC_API_URL=https://<your-backend-domain>/api
CHANNEL_SERVICE_URL=https://<your-channel-service-domain>/api/simulations
WEBHOOK_SECRET=xeno-demo-secret
SIMULATION_SPEED=0.45
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1d
```

### Channel Service Deployment

Deploy the channel service to a separate Node host.

Required env vars:

```env
PORT=5100
NODE_ENV=production
WEBHOOK_SECRET=xeno-demo-secret
SIMULATION_SPEED=0.45
```

Important:

- `PUBLIC_API_URL` must point to the backend domain so the channel service can call webhooks back into the CRM.
- `CHANNEL_SERVICE_URL` must point to the deployed channel service domain so the backend can launch simulations.
- The browser should talk to the Vercel frontend only; Vercel forwards `/api` calls to the backend.

## Step 9. Git Commands

If you are starting from a new folder, run:

```powershell
git init
git add .
git commit -m "Build Xeno Copilot"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

After the initial push, use:

```powershell
git add .
git commit -m "Update Xeno Copilot"
git push
```

## Step 10. Submission Checklist

- Public frontend link
- Public video link
- Walkthrough transcript
- GitHub link for backend
- GitHub link for frontend
- Optional notes for the hiring team

## Demo Flow

Use this order in the video:

1. Seed the demo data
2. Open the copilot screen
3. Ask for a dormant-customer campaign
4. Show the AI plan and reasoning
5. Launch the campaign
6. Show the channel service callbacks flowing back in
7. Open customers and campaign dashboard
8. Open the timeline page
9. Explain the architecture and tradeoffs

## Tradeoffs

The main tradeoff is depth over breadth.

I chose to build one strong marketing copilot workflow instead of adding unrelated CRM modules. That keeps the review story clear and makes the AI behavior easy to defend.

## Related Docs

- [`docs/API.md`](./docs/API.md)
- [`docs/WALKTHROUGH_TRANSCRIPT.md`](./docs/WALKTHROUGH_TRANSCRIPT.md)
- [`docs/REQUIREMENTS_CHECKLIST.md`](./docs/REQUIREMENTS_CHECKLIST.md)
